import AcmeLogo from '@/app/ui/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from './ui/fonts';
import Image from 'next/image';
import db from '@/modules/db';
import { faker } from '@faker-js/faker';
import { revalidatePath } from 'next/cache';
import Button from '@/components/Button';

import {
  users,
  customers,
  invoices,
  revenue,
} from '@/app/lib/placeholder-data';

export default async function Page() {
  // const posts = await db.post.findMany({ orderBy: { createdAt: 'desc' } });

  const generateCustomers = async () => {
    'use server';
    // console.log(new Set(customers.map((customer) => customer.id)));

    const result = await db.customer.createMany({
      data: customers.map((customer) => {
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        };
      }),
    });

    console.log(result);

    revalidatePath('/');
  };

  const generateInvoice = async () => {
    'use server';
    const result = await db.invoice.createMany({
      data: invoices.map((invoice) => {
        return {
          customer_id: invoice.customer_id,
          amount: invoice.amount,
          status: invoice.status,
          date: new Date(invoice.date),
        };
      }),
      // skipDuplicates: true,
    });
    // const result = await db.invoice.findMany();
    console.log(result);
  };

  const generateRevenue = async () => {
    'use server';
    const result = await db.revenue.createMany({
      data: revenue,
    });
    console.log(result);
  };

  const generateUser = async () => {
    'use server';
    const user = await db.user.create({
      data: {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        password: users[0].password,
      },
    });
    console.log(user);
  };

  // const getUser = async () => {
  //   const result = await db.user.findMany();
  //   console.log(result);
  // };

  // getUser();

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-500 p-4 md:h-52">
        <AcmeLogo />
      </div>
      <Button onClick={generateUser}>Generate User</Button>
      <Button onClick={generateCustomers}>Generate Customers</Button>
      <Button onClick={generateInvoice}>Generate Invoices</Button>
      <Button onClick={generateRevenue}>Generate Revenue</Button>

      {/* {posts.map((post) => (
        <div key={post.id}>{post.content}</div>
      ))} */}

      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p
            className={`text-xl text-gray-800 md:text-3xl md:leading-normal ${lusitana.className}`}
          >
            <strong>Welcome to Acme.</strong> This is the example for the{' '}
            <a href="https://nextjs.org/learn/" className="text-blue-500">
              Next.js Learn Course
            </a>
            , brought to you by Vercel.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
          {/* Add Hero Images Here */}
          <Image
            src="/hero-desktop.png"
            width={1000}
            height={760}
            className="hidden md:block"
            alt="screenshots of the dashboard project showing desktop version"
          />
          <Image
            src="/hero-mobile.png"
            width={560}
            height={620}
            className="block md:hidden"
            alt="screenshots of the dashboard project showing mobile version"
          />
        </div>
      </div>
    </main>
  );
}
