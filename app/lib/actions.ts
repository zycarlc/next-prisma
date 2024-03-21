'use server';
import db from '@/modules/db';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const CreateUser = UserSchema.omit({});

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type UserState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.log(validatedFields.error);
    // console.log(validatedFields.error.flatten().fieldErrors);

    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date();
  try {
    await db.invoice.create({
      data: { customer_id: customerId, amount: amountInCents, status, date },
    });
  } catch (error) {
    console.error('error', error);
    throw new Error('Failed to create invoice.');
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  try {
    await db.invoice.update({
      where: {
        id: id,
      },
      data: {
        amount: amountInCents,
        customer_id: customerId,
        status: status,
      },
    });
  } catch (error) {
    console.error('error', error);
    throw new Error('Failed to update invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await db.invoice.delete({
      where: {
        id: id,
      },
    });
    revalidatePath('/dashboard/invoices');
    return { message: 'deleted invoice' };
  } catch (error) {
    console.error('error', error);
    throw new Error('Failed to delete invoice.');
  }
}

export async function createUser(prevState: UserState, formData: FormData) {
  'use server';
  const validatedFields = CreateUser.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  // console.log(formData);

  // console.log(validatedFields.error);

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    // console.log(validatedFields.error);
    // console.log(validatedFields.error.flatten().fieldErrors);

    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create User.',
    };
  }
  const { name, email, password } = validatedFields.data;
  const diggestedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await db.user.create({
      data: { name, email, password: diggestedPassword },
    });
    console.log(user);

    // return user as User[];
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error('Failed to create user.');
  }
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
