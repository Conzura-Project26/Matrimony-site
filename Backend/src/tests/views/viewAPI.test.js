/**
 * Profile View API Integration Tests
 * Phase 3 - Task 3.5: Profile Views & Activity
 * 
 * Tests all HTTP endpoints:
 * - POST /profiles/:profileId/view
 * - GET /profile/viewers
 * - GET /profile/viewed
 * - GET /profile/viewers/count
 * - GET /profile/viewed/count
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../index.js'; // Adjust path as needed
import prisma from '../../config/prisma.js';
import { ViewSource } from '../../types/enums.js';

// Test users and tokens
let viewer1Token, viewer2Token, viewed1Token;
let viewer1Id, viewer2Id, viewed1Id;

beforeAll(async () => {
  // Register and login test users
  const viewer1 = await request(app)
    .post('/auth/register')
    .send({
      mobile_number: '+919876550001',
      full_name: 'API Test Viewer 1',
      email: 'apiviewer1@test.com',
      gender: 'MALE',
      date_of_birth: '1990-01-01',
      password: 'Test@1234'
    });
  viewer1Id = viewer1.body.data.user.id;
  viewer1Token = viewer1.body.data.token;

  const viewer2 = await request(app)
    .post('/auth/register')
    .send({
      mobile_number: '+919876550002',
      full_name: 'API Test Viewer 2',
      email: 'apiviewer2@test.com',
      gender: 'FEMALE',
      date_of_birth: '1992-01-01',
      password: 'Test@1234'
    });
  viewer2Id = viewer2.body.data.user.id;
  viewer2Token = viewer2.body.data.token;

  const viewed1 = await request(app)
    .post('/auth/register')
    .send({
      mobile_number: '+919876550003',
      full_name: 'API Test Viewed 1',
      email: 'apiviewed1@test.com',
      gender: 'FEMALE',
      date_of_birth: '1991-01-01',
      password: 'Test@1234'
    });
  viewed1Id = viewed1.body.data.user.id;
  viewed1Token = viewed1.body.data.token;
});

afterAll(async () => {
  // Cleanup
  await prisma.profileView.deleteMany({
    where: {
      OR: [
        { viewer_id: { in: [viewer1Id, viewer2Id] } },
        { viewed_user_id: viewed1Id }
      ]
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: [viewer1Id, viewer2Id, viewed1Id] }
    }
  });

  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean views before each test
  await prisma.profileView.deleteMany({
    where: {
      OR: [
        { viewer_id: { in: [viewer1Id, viewer2Id] } },
        { viewed_user_id: viewed1Id }
      ]
    }
  });
});

describe('POST /profiles/:profileId/view', () => {
  test('should record a profile view successfully (204)', async () => {
    const response = await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({
        view_source: ViewSource.SEARCH,
        view_duration: 45
      });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    // Verify in database
    const view = await prisma.profileView.findFirst({
      where: {
        viewer_id: viewer1Id,
        viewed_user_id: viewed1Id
      }
    });

    expect(view).toBeTruthy();
    expect(view.view_source).toBe(ViewSource.SEARCH);
  });

  test('should reject unauthenticated requests (401)', async () => {
    const response = await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .send({});

    expect(response.status).toBe(401);
  });

  test('should reject self-views (400)', async () => {
    const response = await request(app)
      .post(`/profiles/${viewer1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Cannot view your own profile');
  });

  test('should reject invalid profile ID (400 or 404)', async () => {
    const response = await request(app)
      .post('/profiles/invalid-id/view')
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    expect([400, 404]).toContain(response.status);
  });

  test('should handle rate limiting (3 views per hour)', async () => {
    // Record 3 views
    await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    // 4th view should still return 204 (silent fail)
    const response = await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({});

    expect(response.status).toBe(204);

    // But only 3 should be in DB
    const count = await prisma.profileView.count({
      where: {
        viewer_id: viewer1Id,
        viewed_user_id: viewed1Id
      }
    });

    expect(count).toBe(3);
  });

  test('should accept optional fields', async () => {
    const response = await request(app)
      .post(`/profiles/${viewed1Id}/view`)
      .set('Authorization', `Bearer ${viewer1Token}`)
      .send({
        view_source: ViewSource.MATCH,
        view_duration: 120,
        search_log_id: null
      });

    expect(response.status).toBe(204);
  });
});

describe('GET /profile/viewers', () => {
  beforeEach(async () => {
    // Create test views
    await prisma.profileView.createMany({
      data: [
        {
          viewer_id: viewer1Id,
          viewed_user_id: viewed1Id,
          view_source: ViewSource.SEARCH,
          viewed_at: new Date('2025-01-01T10:00:00Z')
        },
        {
          viewer_id: viewer1Id,
          viewed_user_id: viewed1Id,
          view_source: ViewSource.DIRECT,
          viewed_at: new Date('2025-01-02T10:00:00Z')
        },
        {
          viewer_id: viewer2Id,
          viewed_user_id: viewed1Id,
          view_source: ViewSource.MATCH,
          viewed_at: new Date('2025-01-03T10:00:00Z')
        }
      ]
    });
  });

  test('should get list of viewers successfully (200)', async () => {
    const response = await request(app)
      .get('/profile/viewers')
      .set('Authorization', `Bearer ${viewed1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.viewers).toHaveLength(2);
    expect(response.body.data.stats.total_views).toBe(3);
    expect(response.body.data.stats.unique_viewers).toBe(2);
  });

  test('should include viewer profile details', async () => {
    const response = await request(app)
      .get('/profile/viewers')
      .set('Authorization', `Bearer ${viewed1Token}`);

    const viewer = response.body.data.viewers[0];
    expect(viewer).toHaveProperty('viewer_id');
    expect(viewer).toHaveProperty('profile_id');
    expect(viewer).toHaveProperty('full_name');
    expect(viewer).toHaveProperty('age');
    expect(viewer).toHaveProperty('gender');
    expect(viewer).toHaveProperty('viewed_at');
    expect(viewer).toHaveProperty('view_count');
    expect(viewer).toHaveProperty('last_active');
    expect(viewer).toHaveProperty('profile_completion');
  });

  test('should paginate correctly', async () => {
    const response = await request(app)
      .get('/profile/viewers')
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${viewed1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.viewers).toHaveLength(1);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.limit).toBe(1);
    expect(response.body.data.pagination.hasMore).toBe(true);
  });

  test('should filter by date range', async () => {
    const response = await request(app)
      .get('/profile/viewers')
      .query({
        from_date: '2025-01-02T00:00:00Z',
        to_date: '2025-01-03T23:59:59Z'
      })
      .set('Authorization', `Bearer ${viewed1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats.total_views).toBe(2); // Only 2 views in date range
  });

  test('should return empty array when no viewers', async () => {
    const response = await request(app)
      .get('/profile/viewers')
      .set('Authorization', `Bearer ${viewer1Token}`); // viewer1 has no viewers

    expect(response.status).toBe(200);
    expect(response.body.data.viewers).toEqual([]);
    expect(response.body.data.stats.total_views).toBe(0);
  });

  test('should reject unauthenticated requests (401)', async () => {
    const response = await request(app)
      .get('/profile/viewers');

    expect(response.status).toBe(401);
  });
});

describe('GET /profile/viewed', () => {
  beforeEach(async () => {
    // viewer1 viewed viewed1
    await prisma.profileView.create({
      data: {
        viewer_id: viewer1Id,
        viewed_user_id: viewed1Id,
        view_source: ViewSource.SEARCH,
        viewed_at: new Date('2025-01-01T10:00:00Z')
      }
    });
  });

  test('should get list of profiles I viewed (200)', async () => {
    const response = await request(app)
      .get('/profile/viewed')
      .set('Authorization', `Bearer ${viewer1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.profiles).toHaveLength(1);
    expect(response.body.data.profiles[0].viewer_id).toBe(viewed1Id);
  });

  test('should include profile details', async () => {
    const response = await request(app)
      .get('/profile/viewed')
      .set('Authorization', `Bearer ${viewer1Token}`);

    const profile = response.body.data.profiles[0];
    expect(profile).toHaveProperty('viewer_id');
    expect(profile).toHaveProperty('full_name');
    expect(profile).toHaveProperty('viewed_at');
    expect(profile).toHaveProperty('view_count');
  });

  test('should paginate correctly', async () => {
    const response = await request(app)
      .get('/profile/viewed')
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${viewer1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.pagination).toBeDefined();
  });

  test('should return empty when user has not viewed any profiles', async () => {
    const response = await request(app)
      .get('/profile/viewed')
      .set('Authorization', `Bearer ${viewed1Token}`); // viewed1 has not viewed anyone

    expect(response.status).toBe(200);
    expect(response.body.data.profiles).toEqual([]);
  });
});

describe('GET /profile/viewers/count', () => {
  beforeEach(async () => {
    await prisma.profileView.createMany({
      data: [
        { viewer_id: viewer1Id, viewed_user_id: viewed1Id, view_source: ViewSource.SEARCH },
        { viewer_id: viewer1Id, viewed_user_id: viewed1Id, view_source: ViewSource.DIRECT },
        { viewer_id: viewer2Id, viewed_user_id: viewed1Id, view_source: ViewSource.MATCH }
      ]
    });
  });

  test('should get correct viewers count (200)', async () => {
    const response = await request(app)
      .get('/profile/viewers/count')
      .set('Authorization', `Bearer ${viewed1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_views).toBe(3);
    expect(response.body.data.unique_viewers).toBe(2);
  });

  test('should return zero for users with no views', async () => {
    const response = await request(app)
      .get('/profile/viewers/count')
      .set('Authorization', `Bearer ${viewer1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.total_views).toBe(0);
    expect(response.body.data.unique_viewers).toBe(0);
  });
});

describe('GET /profile/viewed/count', () => {
  beforeEach(async () => {
    await prisma.profileView.create({
      data: {
        viewer_id: viewer1Id,
        viewed_user_id: viewed1Id,
        view_source: ViewSource.SEARCH
      }
    });
  });

  test('should get correct viewed count (200)', async () => {
    const response = await request(app)
      .get('/profile/viewed/count')
      .set('Authorization', `Bearer ${viewer1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_profiles_viewed).toBe(1);
  });

  test('should return zero when user has not viewed any profiles', async () => {
    const response = await request(app)
      .get('/profile/viewed/count')
      .set('Authorization', `Bearer ${viewed1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.total_profiles_viewed).toBe(0);
  });
});
