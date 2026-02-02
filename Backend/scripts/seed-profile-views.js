/**
 * Seed Script for Profile Views Testing
 * Phase 3 - Task 3.5
 * 
 * Creates test data for profile views feature:
 * - Sample users
 * - Profile views with different sources
 * - Various view patterns for testing
 */

import prisma from '../src/config/prisma.js';
import { ViewSource } from '../src/types/enums.js';

async function seedProfileViewsTestData() {
  console.log('🌱 Seeding profile views test data...\n');

  try {
    // Get existing users for testing
    const users = await prisma.user.findMany({
      where: {
        is_active: true,
        is_profile_verified: true
      },
      take: 10,
      orderBy: { created_at: 'desc' }
    });

    if (users.length < 3) {
      console.error('❌ Need at least 3 active users to seed view data');
      console.log('💡 Run the main seed script first: npx prisma db seed');
      return;
    }

    console.log(`✅ Found ${users.length} users for seeding\n`);

    // Clear existing test views (optional - comment out if you want to keep data)
    // await prisma.profileView.deleteMany({});
    // console.log('🗑️  Cleared existing profile views\n');

    // Create view scenarios
    const scenarios = [
      {
        name: 'Popular Profile (User 1 gets many views)',
        viewerId: users[1].id,
        viewedUserId: users[0].id,
        views: [
          { source: ViewSource.SEARCH, duration: 45, date: new Date('2025-02-01T10:00:00Z') },
          { source: ViewSource.DIRECT, duration: 120, date: new Date('2025-02-01T14:30:00Z') }
        ]
      },
      {
        name: 'Multiple Viewers',
        viewerId: users[2].id,
        viewedUserId: users[0].id,
        views: [
          { source: ViewSource.MATCH, duration: 60, date: new Date('2025-02-01T11:00:00Z') }
        ]
      },
      {
        name: 'Active Viewer (User 2 views many profiles)',
        viewerId: users[1].id,
        viewedUserId: users[3].id,
        views: [
          { source: ViewSource.SEARCH, duration: 30, date: new Date('2025-02-01T09:00:00Z') }
        ]
      },
      {
        name: 'Recommendation Views',
        viewerId: users[4].id,
        viewedUserId: users[0].id,
        views: [
          { source: ViewSource.RECOMMENDATION, duration: 90, date: new Date('2025-02-01T15:00:00Z') }
        ]
      },
      {
        name: 'Quick Views (short duration)',
        viewerId: users[5].id,
        viewedUserId: users[0].id,
        views: [
          { source: ViewSource.SHORTLIST, duration: 5, date: new Date('2025-02-01T16:00:00Z') }
        ]
      },
      {
        name: 'Interest-based View',
        viewerId: users[6].id,
        viewedUserId: users[1].id,
        views: [
          { source: ViewSource.INTEREST, duration: 150, date: new Date('2025-02-01T12:00:00Z') }
        ]
      },
      {
        name: 'Mutual Views (User 1 and User 2)',
        viewerId: users[0].id,
        viewedUserId: users[1].id,
        views: [
          { source: ViewSource.DIRECT, duration: 80, date: new Date('2025-02-01T13:00:00Z') }
        ]
      }
    ];

    let totalViews = 0;

    // Create views based on scenarios
    for (const scenario of scenarios) {
      console.log(`📊 ${scenario.name}`);
      
      for (const view of scenario.views) {
        try {
          await prisma.profileView.create({
            data: {
              viewer_id: scenario.viewerId,
              viewed_user_id: scenario.viewedUserId,
              view_source: view.source,
              view_duration_seconds: view.duration,
              viewed_at: view.date
            }
          });
          totalViews++;
          console.log(`   ✓ Created view: ${view.source} (${view.duration}s)`);
        } catch (error) {
          // Skip if constraint violation (e.g., self-view)
          if (error.code === 'P2003' || error.code === '23514') {
            console.log(`   ⚠️  Skipped invalid view: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`\n✅ Created ${totalViews} profile views\n`);

    // Update view count cache for all users
    console.log('📊 Updating view count cache...');
    
    const viewCounts = await prisma.profileView.groupBy({
      by: ['viewed_user_id'],
      _count: true
    });

    for (const { viewed_user_id, _count } of viewCounts) {
      await prisma.user.update({
        where: { id: viewed_user_id },
        data: { profile_views_count: _count }
      });
    }

    console.log(`✅ Updated view counts for ${viewCounts.length} users\n`);

    // Display summary
    console.log('📈 Summary:');
    console.log('─────────────────────────────────────────────────────');
    
    const stats = await prisma.$queryRaw`
      SELECT 
        u.profile_id,
        u.full_name,
        COUNT(DISTINCT pv.viewer_id) as unique_viewers,
        COUNT(*) as total_views
      FROM users u
      LEFT JOIN profile_views pv ON pv.viewed_user_id = u.id
      WHERE u.id IN (${users[0].id}::uuid, ${users[1].id}::uuid, ${users[2].id}::uuid)
      GROUP BY u.id
      ORDER BY total_views DESC
      LIMIT 5
    `;

    console.log('\nTop Viewed Profiles:');
    stats.forEach(stat => {
      console.log(`  ${stat.profile_id} (${stat.full_name}): ${stat.total_views} views from ${stat.unique_viewers} unique viewers`);
    });

    console.log('\n─────────────────────────────────────────────────────');
    console.log('✅ Profile views seeding completed successfully!\n');

    // Test queries
    console.log('🧪 Testing queries:\n');
    
    // Test 1: Get viewers for User 0
    const viewers = await prisma.profileView.findMany({
      where: { viewed_user_id: users[0].id },
      include: {
        viewer: {
          select: {
            profile_id: true,
            full_name: true
          }
        }
      },
      orderBy: { viewed_at: 'desc' },
      take: 5
    });

    console.log(`📋 Recent viewers for ${users[0].profile_id}:`);
    viewers.forEach(view => {
      console.log(`   ${view.viewer.profile_id} (${view.viewer.full_name}) - ${view.view_source} - ${view.viewed_at.toISOString()}`);
    });

    // Test 2: Get profiles viewed by User 1
    const viewed = await prisma.profileView.findMany({
      where: { viewer_id: users[1].id },
      include: {
        viewed_user: {
          select: {
            profile_id: true,
            full_name: true
          }
        }
      },
      orderBy: { viewed_at: 'desc' }
    });

    console.log(`\n📋 Profiles viewed by ${users[1].profile_id}:`);
    viewed.forEach(view => {
      console.log(`   ${view.viewed_user.profile_id} (${view.viewed_user.full_name}) - ${view.view_source} - ${view.viewed_at.toISOString()}`);
    });

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Error seeding profile views:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  seedProfileViewsTestData()
    .then(() => {
      console.log('🎉 Seed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed script failed:', error);
      process.exit(1);
    });
}

export default seedProfileViewsTestData;
