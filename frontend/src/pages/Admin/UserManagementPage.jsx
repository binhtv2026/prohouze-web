/**
 * ProHouze User Management Page
 * Prompt 4/20 - Organization & Permission Foundation
 * 
 * Admin page for managing users:
 * - View all users with roles and organization info
 * - Assign/change user roles
 * - Assign users to branches/departments/teams
 * - Activate/deactivate users
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Shield,
  MapPin,
  Briefcase,
  UserCheck,
  UserX,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Role level colors
const ROLE_LEVEL_COLORS = {
  0: 'bg-red-100 text-red-800',      // System Admin
  1: 'bg-purple-100 text-purple-800', // CEO
  2: 'bg-blue-100 text-blue-800',     // Branch Director
  3: 'bg-green-100 text-green-800',   // Department Head
  4: 'bg-yellow-100 text-yellow-800', // Team Leader
  5: 'bg-gray-100 text-gray-700',     // Staff
  6: 'bg-orange-100 text-orange-800', // External
};

// Legacy to new role mapping for display
const ROLE_DISPLAY_NAMES = {
  'bod': 'CEO',
  'admin': 'System Admin',
  'manager': 'Branch Director',
  'sales': 'Sales Agent',
  'marketing': 'Marketing Staff',
  'content': 'Content Creator',
  'hr': 'HR Staff',
  'system_admin': 'System Admin',
  'ceo': 'CEO',
  'branch_director': 'Branch Director',
  'department_head': 'Department Head',
  'team_leader': 'Team Leader',
  'sales_agent': 'Sales Agent',
  'marketing_staff': 'Marketing Staff',
  'content_creator': 'Content Creator',
  'hr_staff': 'HR Staff',
  'finance_staff': 'Finance Staff',
  'legal_staff': 'Legal Staff',
  'collaborator': 'Cộng tác viên',
};

const DEMO_USERS = [
  {
    id: 'user-1',
    full_name: 'Nguyễn Minh Khang',
    email: 'sales1@prohouze.com',
    phone: '0909001001',
    role: 'sales_agent',
    branch_id: 'branch-hcm',
    branch_name: 'Chi nhánh TP.HCM',
    department_id: 'dept-sales',
    department_name: 'Kinh doanh',
    team_id: 'team-east',
    team_name: 'Team Đông',
    position_title: 'Chuyên viên kinh doanh',
    is_active: true,
  },
  {
    id: 'user-2',
    full_name: 'Trần Thu Hà',
    email: 'marketing1@prohouze.com',
    phone: '0909002002',
    role: 'marketing_staff',
    branch_id: 'branch-hcm',
    branch_name: 'Chi nhánh TP.HCM',
    department_id: 'dept-mkt',
    department_name: 'Marketing',
    team_id: 'team-digital',
    team_name: 'Digital',
    position_title: 'Chuyên viên marketing',
    is_active: true,
  },
  {
    id: 'user-3',
    full_name: 'Lê Quốc Bảo',
    email: 'manager@prohouze.com',
    phone: '0909003003',
    role: 'branch_director',
    branch_id: 'branch-hcm',
    branch_name: 'Chi nhánh TP.HCM',
    department_id: 'dept-sales',
    department_name: 'Kinh doanh',
    team_id: '',
    team_name: '',
    position_title: 'Giám đốc chi nhánh',
    is_active: true,
  },
  {
    id: 'user-4',
    full_name: 'Phạm Thu Trang',
    email: 'legal1@prohouze.com',
    phone: '0909004004',
    role: 'legal_staff',
    branch_id: 'branch-hn',
    branch_name: 'Chi nhánh Hà Nội',
    department_id: 'dept-legal',
    department_name: 'Pháp lý',
    team_id: '',
    team_name: '',
    position_title: 'Chuyên viên pháp lý',
    is_active: false,
  },
];

const DEMO_ROLES = {
  roles: [
    { code: 'system_admin', level: 0 },
    { code: 'ceo', level: 1 },
    { code: 'branch_director', level: 2 },
    { code: 'department_head', level: 3 },
    { code: 'team_leader', level: 4 },
    { code: 'sales_agent', level: 5 },
    { code: 'marketing_staff', level: 5 },
    { code: 'collaborator', level: 6 },
  ],
};

const DEMO_BRANCHES = [
  { id: 'branch-hcm', name: 'Chi nhánh TP.HCM' },
  { id: 'branch-hn', name: 'Chi nhánh Hà Nội' },
];

const DEMO_DEPARTMENTS = [
  { id: 'dept-sales', branch_id: 'branch-hcm', name: 'Kinh doanh' },
  { id: 'dept-mkt', branch_id: 'branch-hcm', name: 'Marketing' },
  { id: 'dept-legal', branch_id: 'branch-hn', name: 'Pháp lý' },
];

const DEMO_TEAMS = [
  { id: 'team-east', department_id: 'dept-sales', name: 'Team Đông' },
  { id: 'team-west', department_id: 'dept-sales', name: 'Team Tây' },
  { id: 'team-digital', department_id: 'dept-mkt', name: 'Digital' },
];

const ROLE_FILTER_MATCH = {
  all: [],
  bod: ['bod', 'ceo'],
  admin: ['admin', 'system_admin'],
  manager: ['manager', 'branch_director', 'department_head', 'team_leader'],
  sales: ['sales', 'sales_agent'],
  marketing: ['marketing', 'marketing_staff', 'content', 'content_creator'],
  legal_staff: ['legal', 'legal_staff'],
};

export default function UserManagementPage() {
  const { user, hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: '',
    branch_id: '',
    department_id: '',
    team_id: '',
    position_title: '',
    is_active: true,
  });

  const filterRole = searchParams.get('role') || 'all';
  const filterStatus = useMemo(() => {
    const status = searchParams.get('status');
    if (status === 'locked' || status === 'inactive') return 'inactive';
    if (status === 'all') return 'all';
    return 'active';
  }, [searchParams]);

  const updateQueryFilter = useCallback(
    (key, value) => {
      const nextParams = new URLSearchParams(searchParams);

      if (!value || value === 'all') {
        nextParams.delete(key);
      } else if (key === 'status' && value === 'inactive') {
        nextParams.set(key, 'locked');
      } else {
        nextParams.set(key, value);
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes, deptsRes, teamsRes] = await Promise.all([
        api.get('/users', {
          params: {
            role: filterRole === 'all' ? undefined : filterRole,
            is_active: filterStatus === 'all' ? undefined : filterStatus === 'active',
          }
        }),
        api.get('/rbac/roles'),
        api.get('/rbac/branches'),
        api.get('/rbac/departments'),
        api.get('/rbac/teams'),
      ]);
      
      setUsers(Array.isArray(usersRes.data) && usersRes.data.length > 0 ? usersRes.data : DEMO_USERS);
      setRoles(rolesRes.data.roles || DEMO_ROLES.roles);
      setBranches(Array.isArray(branchesRes.data) && branchesRes.data.length > 0 ? branchesRes.data : DEMO_BRANCHES);
      setDepartments(Array.isArray(deptsRes.data) && deptsRes.data.length > 0 ? deptsRes.data : DEMO_DEPARTMENTS);
      setTeams(Array.isArray(teamsRes.data) && teamsRes.data.length > 0 ? teamsRes.data : DEMO_TEAMS);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUsers(DEMO_USERS);
      setRoles(DEMO_ROLES.roles);
      setBranches(DEMO_BRANCHES);
      setDepartments(DEMO_DEPARTMENTS);
      setTeams(DEMO_TEAMS);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users by search term
  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term)
    );
  }).filter((u) => {
    const roleMatch = filterRole === 'all'
      ? true
      : (ROLE_FILTER_MATCH[filterRole] || [filterRole]).includes(u.role);

    const statusMatch = filterStatus === 'all'
      ? true
      : filterStatus === 'active'
        ? u.is_active !== false
        : u.is_active === false;

    return roleMatch && statusMatch;
  });

  // Open edit modal
  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditForm({
      role: userToEdit.role || '',
      branch_id: userToEdit.branch_id || '',
      department_id: userToEdit.department_id || '',
      team_id: userToEdit.team_id || '',
      position_title: userToEdit.position_title || '',
      is_active: userToEdit.is_active !== false,
    });
    setShowEditModal(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      toast.success('Đã cập nhật người dùng');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Không thể cập nhật');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, { is_active: !currentStatus });
      toast.success(currentStatus ? 'Đã vô hiệu hóa' : 'Đã kích hoạt');
      fetchData();
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleInfo = roles.find(r => r.code === role);
    const level = roleInfo?.level ?? 5;
    const colorClass = ROLE_LEVEL_COLORS[level] || ROLE_LEVEL_COLORS[5];
    const displayName = ROLE_DISPLAY_NAMES[role] || role;
    
    return (
      <Badge className={colorClass}>
        {displayName}
      </Badge>
    );
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Get filtered departments based on selected branch
  const filteredDepartments = editForm.branch_id 
    ? departments.filter(d => d.branch_id === editForm.branch_id)
    : departments;

  // Get filtered teams based on selected department
  const filteredTeams = editForm.department_id
    ? teams.filter(t => t.department_id === editForm.department_id)
    : teams;

  return (
    <div className="space-y-6" data-testid="user-management-page">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle="Quản lý tài khoản, phân quyền và tổ chức"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Người dùng' },
        ]}
        rightContent={
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            {hasRole(['bod', 'admin']) && (
              <Button data-testid="add-user-btn">
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm người dùng
              </Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={filterRole} onValueChange={(value) => updateQueryFilter('role', value)}>
              <SelectTrigger className="w-[180px]" data-testid="filter-role">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="bod">CEO</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="legal_staff">Pháp lý</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={(value) => updateQueryFilter('status', value)}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách Người dùng ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback>{getInitials(u.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.full_name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.branch_id ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {branches.find(b => b.id === u.branch_id)?.name || '-'}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {u.department_id ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="h-3 w-3" />
                          {departments.find(d => d.id === u.department_id)?.name || '-'}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {u.team_id ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {teams.find(t => t.id === u.team_id)?.name || '-'}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active !== false ? "success" : "secondary"}>
                        {u.is_active !== false ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {u.current_workload || 0} leads
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`user-menu-${u.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(u)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(u)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Đổi vai trò
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(u.id, u.is_active !== false)}
                            className={u.is_active !== false ? 'text-red-600' : 'text-green-600'}
                          >
                            {u.is_active !== false ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy người dùng nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Chỉnh sửa Người dùng
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Info Header */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedUser.full_name}</div>
                  <div className="text-sm text-gray-500">{selectedUser.email}</div>
                </div>
              </div>
              
              {/* Role Selection */}
              <div>
                <Label>Vai trò *</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                >
                  <SelectTrigger data-testid="edit-role-select">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.code} value={role.code}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${ROLE_LEVEL_COLORS[role.level]} text-xs`}>
                            L{role.level}
                          </Badge>
                          {role.name_vi}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Branch Selection */}
              <div>
                <Label>Chi nhánh</Label>
                <Select
                  value={editForm.branch_id || '__none__'}
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    branch_id: value === '__none__' ? '' : value,
                    department_id: '',
                    team_id: ''
                  })}
                >
                  <SelectTrigger data-testid="edit-branch-select">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không chọn</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Department Selection */}
              <div>
                <Label>Phòng ban</Label>
                <Select
                  value={editForm.department_id || '__none__'}
                  onValueChange={(value) => setEditForm({ 
                    ...editForm, 
                    department_id: value === '__none__' ? '' : value,
                    team_id: ''
                  })}
                  disabled={!editForm.branch_id}
                >
                  <SelectTrigger data-testid="edit-dept-select">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không chọn</SelectItem>
                    {filteredDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Team Selection */}
              <div>
                <Label>Nhóm</Label>
                <Select
                  value={editForm.team_id || '__none__'}
                  onValueChange={(value) => setEditForm({ ...editForm, team_id: value === '__none__' ? '' : value })}
                  disabled={!editForm.department_id}
                >
                  <SelectTrigger data-testid="edit-team-select">
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không chọn</SelectItem>
                    {filteredTeams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Position Title */}
              <div>
                <Label>Chức danh</Label>
                <Input
                  value={editForm.position_title}
                  onChange={(e) => setEditForm({ ...editForm, position_title: e.target.value })}
                  placeholder="VD: Nhân viên Kinh doanh Cấp cao"
                  data-testid="edit-position-input"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveUser} data-testid="save-user-btn">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
