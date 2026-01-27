import { PrismaClient } from '@prisma/client';
import { religionData } from './seeds/religionData.js';
import {
  hinduismCastes,
  hinduismSubCastes,
  islamCastes,
  islamSubCastes,
  christianityCastes,
  christianitySubCastes,
  sikhismCastes,
  sikhismSubCastes,
  buddhismCastes,
  jainismCastes,
  parsiCastes,
  judaismCastes,
  otherCastes
} from './seeds/casteData.js';
import { permissions } from './seeds/permissionData.js';
import { roles, rolePermissions } from './seeds/roleData.js';

const prisma = new PrismaClient();

/**
 * Seed Religions
 */
async function seedReligions() {
  console.log('📿 Seeding religions...');
  
  for (const religion of religionData) {
    await prisma.religion.upsert({
      where: { religion_name: religion.religion_name },
      update: {},
      create: religion
    });
  }
  
  console.log('✅ Religions seeded successfully');
}

/**
 * Seed Castes for a specific religion
 */
async function seedCastes(religionName, castes, subCastes = {}) {
  const religion = await prisma.religion.findUnique({
    where: { religion_name: religionName }
  });

  if (!religion) {
    console.warn(`⚠️  Religion "${religionName}" not found, skipping castes`);
    return;
  }

  for (const casteName of castes) {
    const caste = await prisma.caste.upsert({
      where: {
        religion_id_caste_name: {
          religion_id: religion.id,
          caste_name: casteName
        }
      },
      update: {},
      create: {
        religion_id: religion.id,
        caste_name: casteName,
        is_active: true
      }
    });

    // Seed sub-castes if available for this caste
    if (subCastes[casteName]) {
      for (const subCasteName of subCastes[casteName]) {
        await prisma.subCaste.upsert({
          where: {
            caste_id_sub_caste_name: {
              caste_id: caste.id,
              sub_caste_name: subCasteName
            }
          },
          update: {},
          create: {
            caste_id: caste.id,
            sub_caste_name: subCasteName,
            is_active: true
          }
        });
      }
    }
  }

  console.log(`✅ Castes for ${religionName} seeded successfully`);
}

/**
 * Seed All Castes and Sub-Castes
 */
async function seedAllCastes() {
  console.log('🏛️  Seeding castes and sub-castes...');
  
  await seedCastes('Hinduism', hinduismCastes, hinduismSubCastes);
  await seedCastes('Islam', islamCastes, islamSubCastes);
  await seedCastes('Christianity', christianityCastes, christianitySubCastes);
  await seedCastes('Sikhism', sikhismCastes, sikhismSubCastes);
  await seedCastes('Buddhism', buddhismCastes);
  await seedCastes('Jainism', jainismCastes);
  await seedCastes('Parsi', parsiCastes);
  await seedCastes('Judaism', judaismCastes);
  await seedCastes('Other', otherCastes);
  await seedCastes('No Religion', otherCastes);
  
  console.log('✅ All castes and sub-castes seeded successfully');
}

/**
 * Seed Permissions
 */
async function seedPermissions() {
  console.log('🔑 Seeding permissions...');
  
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { permission_name: permission.permission_name },
      update: {},
      create: permission
    });
  }
  
  console.log('✅ Permissions seeded successfully');
}

/**
 * Seed Roles
 */
async function seedRoles() {
  console.log('👥 Seeding roles...');
  
  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: { description: role.description },
      create: {
        role_name: role.role_name,
        description: role.description
      }
    });
  }
  
  console.log('✅ Roles seeded successfully');
}

/**
 * Seed Role-Permissions Mappings
 */
async function seedRolePermissions() {
  console.log('🔗 Seeding role-permissions...');
  
  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({
      where: { role_name: roleName }
    });

    if (!role) {
      console.warn(`⚠️  Role "${roleName}" not found, skipping permissions`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { permission_name: permissionName }
      });

      if (!permission) {
        console.warn(`⚠️  Permission "${permissionName}" not found, skipping`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: role.id,
            permission_id: permission.id
          }
        },
        update: {},
        create: {
          role_id: role.id,
          permission_id: permission.id
        }
      });
    }

    console.log(`✅ Permissions mapped to ${roleName} role`);
  }
  
  console.log('✅ Role-permissions seeded successfully');
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Seed in order (respecting foreign key dependencies)
    await seedReligions();
    await seedAllCastes();
    await seedPermissions();
    await seedRoles();
    await seedRolePermissions();
    
    console.log('\n🎉 Database seeding completed successfully!');
    
    // Print summary statistics
    const religionCount = await prisma.religion.count();
    const casteCount = await prisma.caste.count();
    const subCasteCount = await prisma.subCaste.count();
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();
    const rolePermissionCount = await prisma.rolePermission.count();
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Religions: ${religionCount}`);
    console.log(`   Castes: ${casteCount}`);
    console.log(`   Sub-Castes: ${subCasteCount}`);
    console.log(`   Permissions: ${permissionCount}`);
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Role-Permission Mappings: ${rolePermissionCount}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
