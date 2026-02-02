/**
 * Profile View Service Tests
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * Test coverage:
 * - Record profile view with rate limiting
 * - Get viewers (deduplicated)
 * - Get viewed profiles
 * - Self-view prevention
 * - Blocked user handling
 * - View counting and caching
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../../config/prisma.js';
import viewService from '../../services/viewService.js';
import { ViewSource } from '../../types/enums.js';

// Test user IDs
let testViewer1, testViewer2, testViewed1, testViewed2;

beforeAll(async () => {
  // Create test users
  testViewer1 = await prisma.user.create({
    data: {
      mobile_number: '+919876540001',
      full_name: 'Test Viewer 1',
      email: 'viewer1@test.com',
      gender: 'MALE',
      date_of_birth: new Date('1990-01-01'),
      is_active: true,
      is_profile_verified: true,
      profile_id: 'TEST_VIEW_001'
    }
  });

  testViewer2 = await prisma.user.create({
    data: {
      mobile_number: '+919876540002',
      full_name: 'Test Viewer 2',
      email: 'viewer2@test.com',
      gender: 'FEMALE',
      date_of_birth: new Date('1992-01-01'),
      is_active: true,
      is_profile_verified: true,
      profile_id: 'TEST_VIEW_002'
    }
  });

  testViewed1 = await prisma.user.create({
    data: {
      mobile_number: '+919876540003',
      full_name: 'Test Viewed 1',
      email: 'viewed1@test.com',
      gender: 'FEMALE',
      date_of_birth: new Date('1991-01-01'),
      is_active: true,
      is_profile_verified: true,
      profile_id: 'TEST_VIEW_003'
    }
  });

  testViewed2 = await prisma.user.create({
    data: {
      mobile_number: '+919876540004',
      full_name: 'Test Viewed 2',
      email: 'viewed2@test.com',
      gender: 'MALE',
      date_of_birth: new Date('1993-01-01'),
      is_active: true,
      is_profile_verified: true,
      profile_id: 'TEST_VIEW_004'
    }
  });
});

afterAll(async () => {
  // Cleanup
  await prisma.profileView.deleteMany({
    where: {
      OR: [
        { viewer_id: { in: [testViewer1.id, testViewer2.id] } },
        { viewed_user_id: { in: [testViewed1.id, testViewed2.id] } }
      ]
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: [testViewer1.id, testViewer2.id, testViewed1.id, testViewed2.id] }
    }
  });

  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean views before each test
  await prisma.profileView.deleteMany({
    where: {
      OR: [
        { viewer_id: { in: [testViewer1.id, testViewer2.id] } },
        { viewed_user_id: { in: [testViewed1.id, testViewed2.id] } }
      ]
    }
  });
});

describe('Profile View Service - Record Views', () => {
  test('should record a profile view successfully', async () => {
    const result = await viewService.recordProfileView(
      testViewer1.id,
      testViewed1.id,
      { viewSource: ViewSource.SEARCH, viewDuration: 30 }
    );

    expect(result.success).toBe(true);
    expect(result.view_id).toBeDefined();

    // Verify in database
    const view = await prisma.profileView.findUnique({
      where: { id: result.view_id }
    });

    expect(view).toBeTruthy();
    expect(view.viewer_id).toBe(testViewer1.id);
    expect(view.viewed_user_id).toBe(testViewed1.id);
    expect(view.view_source).toBe(ViewSource.SEARCH);
    expect(view.view_duration_seconds).toBe(30);
  });

  test('should prevent self-views', async () => {
    await expect(
      viewService.recordProfileView(testViewer1.id, testViewer1.id)
    ).rejects.toThrow('Cannot view your own profile');
  });

  test('should enforce rate limiting (max 3 per hour)', async () => {
    // Record 3 views
    await viewService.recordProfileView(testViewer1.id, testViewed1.id);
    await viewService.recordProfileView(testViewer1.id, testViewed1.id);
    await viewService.recordProfileView(testViewer1.id, testViewed1.id);

    // 4th view should be rate limited (silent fail)
    const result = await viewService.recordProfileView(testViewer1.id, testViewed1.id);
    expect(result.rateLimited).toBe(true);

    // Verify only 3 views in DB
    const count = await prisma.profileView.count({
      where: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed1.id
      }
    });
    expect(count).toBe(3);
  });

  test('should cap view duration at 600 seconds', async () => {
    const result = await viewService.recordProfileView(
      testViewer1.id,
      testViewed1.id,
      { viewDuration: 10000 } // 10000 seconds (way too long)
    );

    const view = await prisma.profileView.findUnique({
      where: { id: result.view_id }
    });

    expect(view.view_duration_seconds).toBe(600); // Capped at 10 minutes
  });

  test('should reject viewing inactive profiles', async () => {
    // Deactivate user
    await prisma.user.update({
      where: { id: testViewed2.id },
      data: { is_active: false }
    });

    await expect(
      viewService.recordProfileView(testViewer1.id, testViewed2.id)
    ).rejects.toThrow('This profile is no longer active');

    // Reactivate for other tests
    await prisma.user.update({
      where: { id: testViewed2.id },
      data: { is_active: true }
    });
  });

  test('should reject viewing non-existent profiles', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    
    await expect(
      viewService.recordProfileView(testViewer1.id, fakeId)
    ).rejects.toThrow('Profile not found');
  });

  test('should increment cached view count', async () => {
    await viewService.recordProfileView(testViewer1.id, testViewed1.id);
    
    // Wait a bit for async update
    await new Promise(resolve => setTimeout(resolve, 100));

    const user = await prisma.user.findUnique({
      where: { id: testViewed1.id },
      select: { profile_views_count: true }
    });

    expect(user.profile_views_count).toBeGreaterThan(0);
  });
});

describe('Profile View Service - Get My Viewers', () => {
  beforeEach(async () => {
    // Create test views
    // Viewer1 views Viewed1 twice
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed1.id,
        view_source: ViewSource.SEARCH,
        viewed_at: new Date('2025-01-01T10:00:00Z')
      }
    });
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed1.id,
        view_source: ViewSource.DIRECT,
        viewed_at: new Date('2025-01-02T10:00:00Z')
      }
    });

    // Viewer2 views Viewed1 once
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer2.id,
        viewed_user_id: testViewed1.id,
        view_source: ViewSource.MATCH,
        viewed_at: new Date('2025-01-03T10:00:00Z')
      }
    });
  });

  test('should get deduplicated viewers with correct counts', async () => {
    const result = await viewService.getMyViewers(testViewed1.id, { page: 1, limit: 10 });

    expect(result.viewers).toHaveLength(2);
    expect(result.stats.total_views).toBe(3);
    expect(result.stats.unique_viewers).toBe(2);

    // Find viewer1 in results
    const viewer1 = result.viewers.find(v => v.viewer_id === testViewer1.id);
    expect(viewer1).toBeDefined();
    expect(viewer1.view_count).toBe(2); // Viewed twice

    // Find viewer2 in results
    const viewer2 = result.viewers.find(v => v.viewer_id === testViewer2.id);
    expect(viewer2).toBeDefined();
    expect(viewer2.view_count).toBe(1);
  });

  test('should show most recent view timestamp', async () => {
    const result = await viewService.getMyViewers(testViewed1.id, { page: 1, limit: 10 });

    const viewer1 = result.viewers.find(v => v.viewer_id === testViewer1.id);
    expect(new Date(viewer1.viewed_at)).toEqual(new Date('2025-01-02T10:00:00Z')); // Latest view
  });

  test('should paginate correctly', async () => {
    const result = await viewService.getMyViewers(testViewed1.id, { page: 1, limit: 1 });

    expect(result.viewers).toHaveLength(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(1);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.hasMore).toBe(true);
  });

  test('should filter by date range', async () => {
    const result = await viewService.getMyViewers(testViewed1.id, {
      fromDate: new Date('2025-01-02T00:00:00Z'),
      toDate: new Date('2025-01-03T23:59:59Z')
    });

    expect(result.stats.total_views).toBe(2); // Only views from Jan 2-3
  });

  test('should return empty array when no viewers', async () => {
    const result = await viewService.getMyViewers(testViewed2.id);

    expect(result.viewers).toEqual([]);
    expect(result.stats.total_views).toBe(0);
    expect(result.stats.unique_viewers).toBe(0);
  });

  test('should include profile details in response', async () => {
    const result = await viewService.getMyViewers(testViewed1.id);

    const viewer = result.viewers[0];
    expect(viewer.profile_id).toBeDefined();
    expect(viewer.full_name).toBeDefined();
    expect(viewer.gender).toBeDefined();
    expect(viewer.age).toBeDefined();
    expect(viewer.profile_completion).toBeDefined();
    expect(viewer.is_verified).toBeDefined();
  });
});

describe('Profile View Service - Get My Viewed Profiles', () => {
  beforeEach(async () => {
    // Viewer1 views Viewed1 and Viewed2
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed1.id,
        view_source: ViewSource.SEARCH,
        viewed_at: new Date('2025-01-01T10:00:00Z')
      }
    });
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed2.id,
        view_source: ViewSource.DIRECT,
        viewed_at: new Date('2025-01-02T10:00:00Z')
      }
    });
  });

  test('should get list of profiles I viewed', async () => {
    const result = await viewService.getMyViewedProfiles(testViewer1.id);

    expect(result.profiles).toHaveLength(2);
    expect(result.profiles.some(p => p.viewer_id === testViewed1.id)).toBe(true);
    expect(result.profiles.some(p => p.viewer_id === testViewed2.id)).toBe(true);
  });

  test('should be deduplicated with latest view', async () => {
    // Add another view of Viewed1
    await prisma.profileView.create({
      data: {
        viewer_id: testViewer1.id,
        viewed_user_id: testViewed1.id,
        view_source: ViewSource.MATCH,
        viewed_at: new Date('2025-01-03T10:00:00Z')
      }
    });

    const result = await viewService.getMyViewedProfiles(testViewer1.id);

    expect(result.profiles).toHaveLength(2); // Still 2 unique profiles
    
    const viewed1 = result.profiles.find(p => p.viewer_id === testViewed1.id);
    expect(new Date(viewed1.viewed_at)).toEqual(new Date('2025-01-03T10:00:00Z')); // Latest view
  });

  test('should paginate correctly', async () => {
    const result = await viewService.getMyViewedProfiles(testViewer1.id, { page: 1, limit: 1 });

    expect(result.profiles).toHaveLength(1);
    expect(result.pagination.hasMore).toBe(true);
  });

  test('should return empty when user has not viewed any profiles', async () => {
    const result = await viewService.getMyViewedProfiles(testViewer2.id);

    expect(result.profiles).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});

describe('Profile View Service - View Counts', () => {
  beforeEach(async () => {
    // Create 5 views: 3 unique viewers
    await prisma.profileView.createMany({
      data: [
        { viewer_id: testViewer1.id, viewed_user_id: testViewed1.id, view_source: ViewSource.SEARCH },
        { viewer_id: testViewer1.id, viewed_user_id: testViewed1.id, view_source: ViewSource.DIRECT },
        { viewer_id: testViewer2.id, viewed_user_id: testViewed1.id, view_source: ViewSource.MATCH },
      ]
    });
  });

  test('should get correct viewers count', async () => {
    const result = await viewService.getViewersCount(testViewed1.id);

    expect(result.total_views).toBe(3);
    expect(result.unique_viewers).toBe(2); // Viewer1 and Viewer2
  });

  test('should get correct viewed count', async () => {
    const result = await viewService.getViewedCount(testViewer1.id);

    expect(result.total_profiles_viewed).toBe(1); // Only viewed Viewed1
  });

  test('should return zero for users with no views', async () => {
    const result = await viewService.getViewersCount(testViewed2.id);

    expect(result.total_views).toBe(0);
    expect(result.unique_viewers).toBe(0);
  });
});
