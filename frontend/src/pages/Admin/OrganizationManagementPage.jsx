/**
 * ProHouze Organization Management Page
 * Prompt 4/20 - Organization & Permission Foundation
 * 
 * Admin page for managing organization hierarchy:
 * - Companies (Tenants)
 * - Branches (Chi nhánh)
 * - Departments (Phòng ban)
 * - Teams (Nhóm)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Network,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrganizationManagementPage() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('tree');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [tree, setTree] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [standardDepts, setStandardDepts] = useState([]);
  
  // Modal states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    name_en: '',
    address: '',
    phone: '',
    email: '',
    region: '',
  });
  
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    name_en: '',
    branch_id: '',
  });
  
  const [teamForm, setTeamForm] = useState({
    code: '',
    name: '',
    name_en: '',
    department_id: '',
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [treeRes, branchesRes, deptsRes, teamsRes, stdDeptsRes] = await Promise.all([
        api.get('/rbac/organization/tree'),
        api.get('/rbac/branches'),
        api.get('/rbac/departments'),
        api.get('/rbac/teams'),
        api.get('/rbac/standard/departments'),
      ]);
      
      setTree(treeRes.data.tree || []);
      setBranches(branchesRes.data || []);
      setDepartments(deptsRes.data || []);
      setTeams(teamsRes.data || []);
      setStandardDepts(stdDeptsRes.data.departments || []);
    } catch (error) {
      console.error('Error fetching organization data:', error);
      // Set empty arrays on error
      setTree([]);
      setBranches([]);
      setDepartments([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Branch handlers
  const handleCreateBranch = async () => {
    try {
      // For now, use a default company_id since we don't have multi-tenant setup
      const payload = {
        ...branchForm,
        company_id: 'default',
      };
      
      await api.post('/rbac/branches', payload);
      toast.success('Đã tạo chi nhánh mới');
      setShowBranchModal(false);
      resetBranchForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể tạo chi nhánh');
    }
  };

  const resetBranchForm = () => {
    setBranchForm({
      code: '',
      name: '',
      name_en: '',
      address: '',
      phone: '',
      email: '',
      region: '',
    });
    setEditingItem(null);
  };

  // Department handlers
  const handleCreateDept = async () => {
    try {
      await api.post('/rbac/departments', deptForm);
      toast.success('Đã tạo phòng ban mới');
      setShowDeptModal(false);
      resetDeptForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể tạo phòng ban');
    }
  };

  const resetDeptForm = () => {
    setDeptForm({
      code: '',
      name: '',
      name_en: '',
      branch_id: '',
    });
    setEditingItem(null);
  };

  // Team handlers
  const handleCreateTeam = async () => {
    try {
      await api.post('/rbac/teams', teamForm);
      toast.success('Đã tạo nhóm mới');
      setShowTeamModal(false);
      resetTeamForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể tạo nhóm');
    }
  };

  const resetTeamForm = () => {
    setTeamForm({
      code: '',
      name: '',
      name_en: '',
      department_id: '',
    });
    setEditingItem(null);
  };

  // Apply standard department template
  const applyStandardDept = (dept) => {
    setDeptForm({
      ...deptForm,
      code: dept.code,
      name: dept.name,
      name_en: dept.name_en,
    });
  };

  // Render organization tree
  const renderTreeNode = (node, level = 0) => {
    const icons = {
      company: Building2,
      branch: MapPin,
      department: Briefcase,
      team: Users,
    };
    
    const colors = {
      company: 'text-blue-600',
      branch: 'text-green-600',
      department: 'text-orange-600',
      team: 'text-purple-600',
    };
    
    const Icon = icons[node.type] || Building2;
    
    return (
      <div key={node.id} className="mb-2">
        <div 
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <Icon className={`h-5 w-5 ${colors[node.type]}`} />
          <span className="font-medium">{node.name}</span>
          <Badge variant="outline" className="text-xs">
            {node.code}
          </Badge>
          {node.user_count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {node.user_count} người
            </Badge>
          )}
        </div>
        {node.children?.map(child => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="organization-management-page">
      <PageHeader
        title="Cơ cấu Tổ chức"
        subtitle="Quản lý chi nhánh, phòng ban và nhóm"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Cơ cấu Tổ chức' },
        ]}
        rightContent={
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tree" data-testid="tab-tree">
            <Network className="h-4 w-4 mr-2" />
            Sơ đồ
          </TabsTrigger>
          <TabsTrigger value="branches" data-testid="tab-branches">
            <MapPin className="h-4 w-4 mr-2" />
            Chi nhánh
          </TabsTrigger>
          <TabsTrigger value="departments" data-testid="tab-departments">
            <Briefcase className="h-4 w-4 mr-2" />
            Phòng ban
          </TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-teams">
            <Users className="h-4 w-4 mr-2" />
            Nhóm
          </TabsTrigger>
        </TabsList>

        {/* Organization Tree */}
        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Sơ đồ Tổ chức
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : tree.length > 0 ? (
                <div className="space-y-2">
                  {tree.map(node => renderTreeNode(node))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có dữ liệu tổ chức</p>
                  <p className="text-sm mt-2">Hãy tạo chi nhánh và phòng ban để bắt đầu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="branches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Danh sách Chi nhánh
              </CardTitle>
              {hasRole(['bod', 'admin']) && (
                <Button onClick={() => setShowBranchModal(true)} data-testid="add-branch-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Chi nhánh
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : branches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Địa chỉ</TableHead>
                      <TableHead>Vùng</TableHead>
                      <TableHead>Quản lý</TableHead>
                      <TableHead>Phòng ban</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map(branch => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <Badge variant="outline">{branch.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{branch.address || '-'}</TableCell>
                        <TableCell>{branch.region || '-'}</TableCell>
                        <TableCell>{branch.manager_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{branch.department_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{branch.user_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có chi nhánh nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Danh sách Phòng ban
              </CardTitle>
              {hasRole(['bod', 'admin']) && (
                <Button onClick={() => setShowDeptModal(true)} data-testid="add-dept-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Phòng ban
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : departments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Chi nhánh</TableHead>
                      <TableHead>Trưởng phòng</TableHead>
                      <TableHead>Nhóm</TableHead>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map(dept => (
                      <TableRow key={dept.id}>
                        <TableCell>
                          <Badge variant="outline">{dept.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.branch_name || '-'}</TableCell>
                        <TableCell>{dept.head_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{dept.team_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{dept.user_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có phòng ban nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách Nhóm
              </CardTitle>
              {hasRole(['bod', 'admin', 'manager']) && (
                <Button onClick={() => setShowTeamModal(true)} data-testid="add-team-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Nhóm
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : teams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Phòng ban</TableHead>
                      <TableHead>Trưởng nhóm</TableHead>
                      <TableHead>Thành viên</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map(team => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <Badge variant="outline">{team.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.department_name || '-'}</TableCell>
                        <TableCell>{team.leader_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{team.user_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có nhóm nào</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Branch Modal */}
      <Dialog open={showBranchModal} onOpenChange={setShowBranchModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Chi nhánh mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã chi nhánh *</Label>
                <Input
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="VD: HN01"
                  data-testid="branch-code-input"
                />
              </div>
              <div>
                <Label>Vùng miền</Label>
                <Select
                  value={branchForm.region}
                  onValueChange={(value) => setBranchForm({ ...branchForm, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vùng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="north">Miền Bắc</SelectItem>
                    <SelectItem value="central">Miền Trung</SelectItem>
                    <SelectItem value="south">Miền Nam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tên chi nhánh *</Label>
              <Input
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="VD: Chi nhánh Hà Nội 1"
                data-testid="branch-name-input"
              />
            </div>
            <div>
              <Label>Tên tiếng Anh</Label>
              <Input
                value={branchForm.name_en}
                onChange={(e) => setBranchForm({ ...branchForm, name_en: e.target.value })}
                placeholder="VD: Hanoi Branch 1"
              />
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="Địa chỉ chi nhánh"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Điện thoại</Label>
                <Input
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="Số điện thoại"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={branchForm.email}
                  onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                  placeholder="Email chi nhánh"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateBranch}
              disabled={!branchForm.code || !branchForm.name}
              data-testid="save-branch-btn"
            >
              Tạo Chi nhánh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Modal */}
      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Phòng ban mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Standard department templates */}
            <div>
              <Label>Mẫu phòng ban chuẩn</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {standardDepts.map(dept => (
                  <Button
                    key={dept.code}
                    variant="outline"
                    size="sm"
                    onClick={() => applyStandardDept(dept)}
                  >
                    {dept.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Chi nhánh *</Label>
              <Select
                value={deptForm.branch_id}
                onValueChange={(value) => setDeptForm({ ...deptForm, branch_id: value })}
              >
                <SelectTrigger data-testid="dept-branch-select">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã phòng ban *</Label>
                <Input
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="VD: sales"
                  data-testid="dept-code-input"
                />
              </div>
              <div>
                <Label>Tên phòng ban *</Label>
                <Input
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="VD: Kinh doanh"
                  data-testid="dept-name-input"
                />
              </div>
            </div>
            
            <div>
              <Label>Tên tiếng Anh</Label>
              <Input
                value={deptForm.name_en}
                onChange={(e) => setDeptForm({ ...deptForm, name_en: e.target.value })}
                placeholder="VD: Sales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeptModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateDept}
              disabled={!deptForm.branch_id || !deptForm.code || !deptForm.name}
              data-testid="save-dept-btn"
            >
              Tạo Phòng ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm Nhóm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Phòng ban *</Label>
              <Select
                value={teamForm.department_id}
                onValueChange={(value) => setTeamForm({ ...teamForm, department_id: value })}
              >
                <SelectTrigger data-testid="team-dept-select">
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} - {dept.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã nhóm *</Label>
                <Input
                  value={teamForm.code}
                  onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value })}
                  placeholder="VD: team_a"
                  data-testid="team-code-input"
                />
              </div>
              <div>
                <Label>Tên nhóm *</Label>
                <Input
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="VD: Nhóm A"
                  data-testid="team-name-input"
                />
              </div>
            </div>
            
            <div>
              <Label>Tên tiếng Anh</Label>
              <Input
                value={teamForm.name_en}
                onChange={(e) => setTeamForm({ ...teamForm, name_en: e.target.value })}
                placeholder="VD: Team A"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateTeam}
              disabled={!teamForm.department_id || !teamForm.code || !teamForm.name}
              data-testid="save-team-btn"
            >
              Tạo Nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
