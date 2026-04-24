/**
 * Recruitment Link Generator Page
 * Generate QR codes and shareable links for recruitment campaigns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { generateQRCode, getReferralLink } from '../../api/recruitmentApi';
import { QrCode, Copy, Download, Share2, Link2, Users, ExternalLink } from 'lucide-react';

export default function LinkGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get base URL from current location
    setBaseUrl(window.location.origin);
    
    // Try to get user ID from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id || user.user_id || '');
      } catch (e) {}
    }
  }, []);

  const handleGenerate = async () => {
    if (!userId && !campaignId) {
      toast.error('Vui lòng nhập User ID hoặc Campaign ID');
      return;
    }

    setLoading(true);
    try {
      const result = await generateQRCode(userId || null, campaignId || null);
      if (result.success) {
        // Build full URL
        const fullUrl = `${baseUrl}${result.apply_url}`;
        setQrResult({
          ...result,
          fullUrl
        });
        toast.success('Tạo link thành công!');
      } else {
        toast.error('Không thể tạo QR code');
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!qrResult?.fullUrl) return;
    
    try {
      await navigator.clipboard.writeText(qrResult.fullUrl);
      toast.success('Đã copy link!');
    } catch (e) {
      toast.error('Không thể copy');
    }
  };

  const handleDownload = () => {
    if (!qrResult?.qr_image) return;
    
    const link = document.createElement('a');
    link.download = `recruitment-qr-${userId || campaignId || 'general'}.png`;
    link.href = qrResult.qr_image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải QR code!');
  };

  const handleShare = async () => {
    if (!qrResult?.fullUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ProHouze - Tuyển dụng',
          text: 'Tham gia đội ngũ ProHouze ngay!',
          url: qrResult.fullUrl
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Link Tuyển Dụng</h1>
          <p className="text-gray-600 mt-2">Tạo QR code và link để chia sẻ tuyển dụng</p>
        </div>

        {/* Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Thông tin link</CardTitle>
            <CardDescription>
              Nhập thông tin để tạo link tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID (ref_id)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="userId"
                  placeholder="ID người giới thiệu"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-id"
                />
              </div>
              <p className="text-xs text-gray-500">
                Để tracking hoa hồng cho người giới thiệu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign ID</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="campaignId"
                  placeholder="VD: SALE2026, HIRING_Q1"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="pl-10"
                  data-testid="input-campaign-id"
                />
              </div>
              <p className="text-xs text-gray-500">
                Để tracking hiệu quả chiến dịch
              </p>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full" 
              disabled={loading}
              data-testid="btn-generate"
            >
              {loading ? 'Đang tạo...' : 'Tạo Link & QR Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {qrResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Kết quả
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <img 
                    src={qrResult.qr_image} 
                    alt="QR Code"
                    className="w-48 h-48"
                    data-testid="qr-image"
                  />
                </div>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label>Link tuyển dụng</Label>
                <div className="flex gap-2">
                  <Input
                    value={qrResult.fullUrl}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="result-link"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy} title="Copy">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tracking Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-gray-700">Tracking:</p>
                {qrResult.ref_id && (
                  <p className="text-gray-600">
                    <span className="font-medium">ref_id:</span> {qrResult.ref_id}
                  </p>
                )}
                {qrResult.campaign_id && (
                  <p className="text-gray-600">
                    <span className="font-medium">campaign_id:</span> {qrResult.campaign_id}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Tải QR
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Chia sẻ
                </Button>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <a 
                  href={qrResult.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Xem trang đăng ký
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
