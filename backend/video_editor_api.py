"""
ProHouzing Video Editor API
Server-side video generation using FFmpeg
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import jwt
import logging
import subprocess
import json
import asyncio
import shutil
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'prohouzing')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Video output directory
# Prefer a repo-local path so the API can run in local dev without /app mounts.
VIDEO_OUTPUT_DIR = Path(__file__).parent / "generated_videos"
VIDEO_OUTPUT_DIR.mkdir(exist_ok=True)

video_editor_router = APIRouter(prefix="/admin/video-editor", tags=["Video Editor"])
security = HTTPBearer()

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("role") not in ["bod", "admin", "manager", "marketing", "content"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== MODELS ====================

class SlideData(BaseModel):
    id: str
    type: str = "custom"
    duration: int = 3
    bg_color: str = "#316585"
    text_color: str = "#ffffff"
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image: Optional[str] = None

class ProjectInfo(BaseModel):
    name: str
    slogan: Optional[str] = None
    price: Optional[str] = None
    location: Optional[str] = None
    phone: str = "1800 1234"
    website: str = "prohouzing.vn"

class VideoGenerationRequest(BaseModel):
    project_info: ProjectInfo
    slides: List[SlideData]
    music_url: Optional[str] = None
    quality: str = "1080p"  # 720p, 1080p, 4k
    format: str = "mp4"  # mp4, webm, mov
    template_id: Optional[str] = None

class VideoJobResponse(BaseModel):
    job_id: str
    status: str
    message: str
    created_at: str
    estimated_duration: Optional[int] = None

class VideoJobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int = 0
    message: str
    download_url: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def get_resolution(quality: str) -> tuple:
    """Get resolution based on quality setting"""
    resolutions = {
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        "4k": (3840, 2160)
    }
    return resolutions.get(quality, (1920, 1080))

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

async def download_image(url: str, output_path: str) -> bool:
    """Download image from URL"""
    try:
        import urllib.request
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        logger.error(f"Failed to download image {url}: {e}")
        return False

async def download_audio(url: str, output_path: str) -> bool:
    """Download audio from URL"""
    try:
        import urllib.request
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        logger.error(f"Failed to download audio {url}: {e}")
        return False

def create_slide_image(slide: SlideData, output_path: str, width: int, height: int) -> bool:
    """Create a slide image using FFmpeg"""
    try:
        bg_color = slide.bg_color.lstrip('#')
        text_color = slide.text_color.lstrip('#')
        
        # Create solid color background
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c={bg_color}:s={width}x{height}:d=1",
            "-frames:v", "1"
        ]
        
        # Add text overlays if present
        filter_complex = []
        
        if slide.title:
            # Escape special characters for FFmpeg
            title_escaped = slide.title.replace(":", "\\:").replace("'", "\\'")
            title_filter = f"drawtext=text='{title_escaped}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=72:fontcolor={text_color}:x=(w-text_w)/2:y=(h-text_h)/2-50"
            filter_complex.append(title_filter)
        
        if slide.subtitle:
            subtitle_escaped = slide.subtitle.replace(":", "\\:").replace("'", "\\'")
            subtitle_filter = f"drawtext=text='{subtitle_escaped}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=36:fontcolor={text_color}@0.8:x=(w-text_w)/2:y=(h-text_h)/2+50"
            filter_complex.append(subtitle_filter)
        
        if filter_complex:
            cmd.extend(["-vf", ",".join(filter_complex)])
        
        cmd.append(output_path)
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg error creating slide: {result.stderr}")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Error creating slide image: {e}")
        return False

async def generate_video_task(job_id: str, request: VideoGenerationRequest):
    """Background task to generate video"""
    try:
        # Update job status to processing
        await db.video_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "processing", "progress": 10}}
        )
        
        width, height = get_resolution(request.quality)
        temp_dir = tempfile.mkdtemp(prefix="video_")
        
        try:
            slide_files = []
            total_slides = len(request.slides)
            
            # Generate slide images
            for i, slide in enumerate(request.slides):
                progress = 10 + int((i / total_slides) * 40)
                await db.video_jobs.update_one(
                    {"id": job_id},
                    {"$set": {"progress": progress, "message": f"Tạo slide {i+1}/{total_slides}..."}}
                )
                
                slide_path = os.path.join(temp_dir, f"slide_{i:03d}.png")
                
                # If slide has an image, download and use it as background
                if slide.image:
                    bg_image_path = os.path.join(temp_dir, f"bg_{i:03d}.jpg")
                    if await download_image(slide.image, bg_image_path):
                        # Create slide with background image
                        cmd = [
                            "ffmpeg", "-y",
                            "-i", bg_image_path,
                            "-vf", f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"
                        ]
                        
                        # Add text overlays
                        text_filters = []
                        if slide.title:
                            title_escaped = slide.title.replace(":", "\\:").replace("'", "\\'").replace('"', '\\"')
                            text_filters.append(
                                f"drawtext=text='{title_escaped}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=72:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2-50"
                            )
                        if slide.subtitle:
                            subtitle_escaped = slide.subtitle.replace(":", "\\:").replace("'", "\\'").replace('"', '\\"')
                            text_filters.append(
                                f"drawtext=text='{subtitle_escaped}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=36:fontcolor=white@0.9:borderw=2:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2+50"
                            )
                        
                        if text_filters:
                            cmd.extend(["-vf", ",".join([f"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}"] + text_filters)])
                        
                        cmd.append(slide_path)
                        subprocess.run(cmd, capture_output=True, timeout=60)
                    else:
                        create_slide_image(slide, slide_path, width, height)
                else:
                    create_slide_image(slide, slide_path, width, height)
                
                if os.path.exists(slide_path):
                    slide_files.append({
                        "path": slide_path,
                        "duration": slide.duration
                    })
            
            if not slide_files:
                raise Exception("No slides generated")
            
            # Update progress
            await db.video_jobs.update_one(
                {"id": job_id},
                {"$set": {"progress": 60, "message": "Ghép video..."}}
            )
            
            # Create video from slides using FFmpeg concat
            concat_file = os.path.join(temp_dir, "concat.txt")
            with open(concat_file, 'w') as f:
                for sf in slide_files:
                    f.write(f"file '{sf['path']}'\n")
                    f.write(f"duration {sf['duration']}\n")
                # Add last file again for proper ending
                f.write(f"file '{slide_files[-1]['path']}'\n")
            
            # Generate output filename
            output_filename = f"{job_id}.{request.format}"
            output_path = VIDEO_OUTPUT_DIR / output_filename
            
            # FFmpeg command to create video
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-vsync", "vfr",
                "-pix_fmt", "yuv420p",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23"
            ]
            
            # Add audio if provided
            if request.music_url:
                audio_path = os.path.join(temp_dir, "audio.mp3")
                if await download_audio(request.music_url, audio_path):
                    total_duration = sum(sf['duration'] for sf in slide_files)
                    cmd.extend([
                        "-i", audio_path,
                        "-t", str(total_duration),
                        "-c:a", "aac",
                        "-b:a", "128k",
                        "-shortest"
                    ])
            
            cmd.append(str(output_path))
            
            # Run FFmpeg
            await db.video_jobs.update_one(
                {"id": job_id},
                {"$set": {"progress": 80, "message": "Xuất video..."}}
            )
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                raise Exception(f"Video generation failed: {result.stderr[:200]}")
            
            # Verify output file exists
            if not output_path.exists():
                raise Exception("Output video file not created")
            
            # Update job as completed
            download_url = f"/api/admin/video-editor/download/{job_id}"
            
            await db.video_jobs.update_one(
                {"id": job_id},
                {"$set": {
                    "status": "completed",
                    "progress": 100,
                    "message": "Video đã sẵn sàng!",
                    "download_url": download_url,
                    "output_path": str(output_path),
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Video generated successfully: {job_id}")
            
        finally:
            # Cleanup temp directory
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp dir: {e}")
    
    except Exception as e:
        logger.error(f"Video generation error for job {job_id}: {e}")
        await db.video_jobs.update_one(
            {"id": job_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "message": "Tạo video thất bại"
            }}
        )

# ==================== API ROUTES ====================

@video_editor_router.post("/generate", response_model=VideoJobResponse)
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_admin)
):
    """Start video generation job"""
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate estimated duration
    total_slides_duration = sum(s.duration for s in request.slides)
    estimated_processing = total_slides_duration * 2  # Rough estimate
    
    # Create job record
    job_doc = {
        "id": job_id,
        "status": "pending",
        "progress": 0,
        "message": "Đang chờ xử lý...",
        "download_url": None,
        "error": None,
        "request": request.model_dump(),
        "created_by": current_user["id"],
        "created_at": now,
        "completed_at": None
    }
    
    await db.video_jobs.insert_one(job_doc)
    
    # Start background task
    background_tasks.add_task(generate_video_task, job_id, request)
    
    logger.info(f"Video generation job started: {job_id} by {current_user['full_name']}")
    
    return VideoJobResponse(
        job_id=job_id,
        status="pending",
        message="Video đang được xử lý...",
        created_at=now,
        estimated_duration=estimated_processing
    )

@video_editor_router.get("/status/{job_id}", response_model=VideoJobStatus)
async def get_job_status(job_id: str, current_user: dict = Depends(get_current_admin)):
    """Get video generation job status"""
    job = await db.video_jobs.find_one({"id": job_id}, {"_id": 0, "request": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Map 'id' to 'job_id' for the response model
    job["job_id"] = job.pop("id", job_id)
    
    return VideoJobStatus(**job)

@video_editor_router.get("/download/{job_id}")
async def download_video(job_id: str, current_user: dict = Depends(get_current_admin)):
    """Download generated video"""
    job = await db.video_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Video not ready")
    
    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    filename = f"prohouzing_video_{job_id[:8]}.{job.get('request', {}).get('format', 'mp4')}"
    
    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename=filename
    )

@video_editor_router.get("/jobs")
async def list_jobs(
    status: Optional[str] = None,
    limit: int = 20,
    current_user: dict = Depends(get_current_admin)
):
    """List video generation jobs"""
    query: Dict[str, Any] = {}
    
    # Filter by user unless admin
    if current_user.get("role") not in ["bod", "admin"]:
        query["created_by"] = current_user["id"]
    
    if status:
        query["status"] = status
    
    jobs = await db.video_jobs.find(query, {"_id": 0, "request": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    return jobs

@video_editor_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_admin)):
    """Delete video job and file"""
    job = await db.video_jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete video file if exists
    output_path = job.get("output_path")
    if output_path and os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception as e:
            logger.warning(f"Failed to delete video file: {e}")
    
    await db.video_jobs.delete_one({"id": job_id})
    
    return {"success": True, "message": "Job deleted"}

# ==================== TEMPLATES ====================

@video_editor_router.get("/templates")
async def get_video_templates():
    """Get available video templates"""
    templates = [
        {
            "id": "real-estate-modern",
            "name": "Bất động sản Hiện đại",
            "thumbnail": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
            "slides": [
                {"type": "intro", "duration": 3, "bg_color": "#316585", "text_color": "#ffffff"},
                {"type": "features", "duration": 4, "bg_color": "#ffffff", "text_color": "#1e293b"},
                {"type": "gallery", "duration": 5, "bg_color": "#f8fafc", "text_color": "#1e293b"},
                {"type": "pricing", "duration": 4, "bg_color": "#316585", "text_color": "#ffffff"},
                {"type": "contact", "duration": 3, "bg_color": "#1e293b", "text_color": "#ffffff"},
            ]
        },
        {
            "id": "luxury-villa",
            "name": "Biệt thự Cao cấp",
            "thumbnail": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
            "slides": [
                {"type": "intro", "duration": 4, "bg_color": "#1a1a2e", "text_color": "#ffffff"},
                {"type": "features", "duration": 5, "bg_color": "#16213e", "text_color": "#ffffff"},
                {"type": "gallery", "duration": 6, "bg_color": "#0f3460", "text_color": "#ffffff"},
                {"type": "contact", "duration": 3, "bg_color": "#e94560", "text_color": "#ffffff"},
            ]
        },
        {
            "id": "apartment-simple",
            "name": "Căn hộ Đơn giản",
            "thumbnail": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
            "slides": [
                {"type": "intro", "duration": 3, "bg_color": "#ffffff", "text_color": "#316585"},
                {"type": "gallery", "duration": 4, "bg_color": "#f1f5f9", "text_color": "#1e293b"},
                {"type": "pricing", "duration": 3, "bg_color": "#316585", "text_color": "#ffffff"},
                {"type": "contact", "duration": 2, "bg_color": "#1e293b", "text_color": "#ffffff"},
            ]
        }
    ]
    
    return templates

# ==================== HEALTH CHECK ====================

@video_editor_router.get("/health")
async def check_ffmpeg():
    """Check if FFmpeg is available"""
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            return {"status": "healthy", "ffmpeg_version": version}
        else:
            return {"status": "unhealthy", "error": "FFmpeg not working"}
    except FileNotFoundError:
        return {"status": "unhealthy", "error": "FFmpeg not installed"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
