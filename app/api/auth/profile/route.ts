import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/directus';
import { readUsers, updateUsers } from '@directus/sdk';
import { requireAuth } from '@/lib/auth';
import { getPermissionsForRole } from '@/lib/security/permissions';
import { validateText, createValidationError } from '@/lib/input-validation';

export async function GET(request: NextRequest) {
  return requireAuth(async (request, context) => {
    try {
      const { userId } = context;
      const directus = createClient();

      const users = await directus.request(
        readUsers({
          filter: { id: { _eq: userId } },
          fields: ['id', 'first_name', 'last_name', 'email', 'role.name', 'avatar', 'description'],
          limit: 1
        })
      );

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];
      const directusRole = user.role?.name || 'user';
      
      // Map Directus roles to app roles (same logic as login)
      const role = directusRole.toLowerCase().includes('admin') ? 'admin' : 'editor';
      
      console.log('Profile API - Directus role:', directusRole, '-> Mapped role:', role);

      const permissions = getPermissionsForRole(role);

      return NextResponse.json({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: role, // Already mapped to 'admin' or 'editor'
        permissions,
        avatar: user.avatar,
        description: user.description
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return requireAuth(async (request, context) => {
    try {
      const { userId } = context;
      const { firstName, lastName, description } = await request.json();

      // Validate input
      const errors: string[] = [];
      let sanitizedFirstName: string | undefined;
      let sanitizedLastName: string | undefined;
      let sanitizedDescription: string | undefined;

      if (firstName !== undefined) {
        const firstNameResult = validateText(firstName, 'First name', 50);
        if (!firstNameResult.isValid) {
          errors.push(firstNameResult.error!);
        } else {
          sanitizedFirstName = firstNameResult.sanitized;
        }
      }

      if (lastName !== undefined) {
        const lastNameResult = validateText(lastName, 'Last name', 50);
        if (!lastNameResult.isValid) {
          errors.push(lastNameResult.error!);
        } else {
          sanitizedLastName = lastNameResult.sanitized;
        }
      }

      if (description !== undefined) {
        const descriptionResult = validateText(description, 'Description', 500);
        if (!descriptionResult.isValid) {
          errors.push(descriptionResult.error!);
        } else {
          sanitizedDescription = descriptionResult.sanitized;
        }
      }

      if (errors.length > 0) {
        return NextResponse.json(
          { error: errors.join('. ') },
          { status: 400 }
        );
      }

      const directus = createClient();

      // Update user profile
      await directus.request(
        updateUsers([userId], {
          ...(sanitizedFirstName !== undefined && { first_name: sanitizedFirstName }),
          ...(sanitizedLastName !== undefined && { last_name: sanitizedLastName }),
          ...(sanitizedDescription !== undefined && { description: sanitizedDescription })
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }
  })(request);
}
