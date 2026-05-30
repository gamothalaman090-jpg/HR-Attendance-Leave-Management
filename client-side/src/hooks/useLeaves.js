import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import leaveService from '@/services/leaveService';

/**
 * Hook to fetch leave requests with server-side pagination.
 * @param {boolean} isHR - whether to fetch all (admin) or own leaves
 * @param {{ page?: number, limit?: number, status?: string }} options
 */
export function useLeaves(isHR = false, { page = 1, limit = 20, status } = {}) {
  return useQuery({
    queryKey: ['leaves', isHR ? 'all' : 'my', { page, limit, status }],
    queryFn: () =>
      isHR
        ? leaveService.getAll({ page, limit, status })
        : leaveService.getMyLeaves({ page, limit, status }),
    keepPreviousData: true,
  });
}

/**
 * Hook to fetch pending leave requests.
 */
export function usePendingLeaves() {
  return useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: () => leaveService.getPending(),
  });
}

/**
 * Hook to fetch leave requests for a specific employee.
 */
export function useEmployeeLeaves(employeeId) {
  return useQuery({
    queryKey: ['leaves', 'employee', employeeId],
    queryFn: () => leaveService.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

/**
 * Hook to fetch the current user's leave balance.
 */
export function useLeaveBalance() {
  return useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => leaveService.getBalance(),
  });
}

/**
 * Hook to create a new leave request.
 */
export function useCreateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaveData) => leaveService.create(leaveData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}

/**
 * Hook to approve a leave request.
 */
export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approver }) => leaveService.approve(id, approver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

/**
 * Hook to reject a leave request.
 */
export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approver }) => leaveService.reject(id, approver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

/**
 * Hook to cancel a leave request.
 */
export function useCancelLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => leaveService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
  });
}
