import db from '@/modules/db';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchRevenue() {
  noStore();
  try {
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await db.revenue.findMany();
    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    const data = await db.invoice.findMany({
      take: 5,
      include: {
        customer: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    await await new Promise((resolve) => setTimeout(resolve, 1000));

    const invoiceCountPromise = await db.invoice.count();
    const customerCountPromise = await db.customer.count();
    const invoiceStatusPromise = await db.invoice.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
    });

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0] ?? '0');
    const numberOfCustomers = Number(data[1] ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][1]._sum.amount ?? 0);
    const totalPendingInvoices = formatCurrency(data[2][0]._sum.amount ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // const invoices = await db.$queryRaw`
    //   -- SELECT
    //   --   invoices.id,
    //   --   invoices.amount,
    //   --   invoices.date,
    //   --   invoices.status,
    //   --   customers.name,
    //   --   customers.email,
    //   --   customers.image_url
    //   -- FROM invoices
    //   -- JOIN customers ON invoices.customer_id = customers.id
    //   -- WHERE
    //   --   customers.name ILIKE ${`%${query}%`} OR
    //   --   customers.email ILIKE ${`%${query}%`} OR
    //   --   invoices.amount::text ILIKE ${`%${query}%`} OR
    //   --   invoices.date::text ILIKE ${`%${query}%`} OR
    //   --   invoices.status ILIKE ${`%${query}%`}
    //   -- ORDER BY invoices.date DESC
    //   -- LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    // `;

    const invoices = await db.invoice.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        customer: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
      where: {
        OR: [
          {
            customer: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customer: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            amount: {
              equals: parseInt(query) || undefined,
            },
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        date: 'desc',
      },
      take: ITEMS_PER_PAGE,
      skip: offset,
    });

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    //   const coun1 = await sql`SELECT COUNT(*)
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   WHERE
    //     customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`} OR
    //     invoices.amount::text ILIKE ${`%${query}%`} OR
    //     invoices.date::text ILIKE ${`%${query}%`} OR
    //     invoices.status ILIKE ${`%${query}%`}
    // `;

    const count = await db.invoice.findMany({
      where: {
        OR: [
          {
            customer: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customer: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            amount: {
              equals: parseInt(query) || undefined,
            },
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    const totalPages = Math.ceil(Number(count.length) / ITEMS_PER_PAGE);

    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    // const data = await sql<InvoiceForm>`
    //   SELECT
    //     invoices.id,
    //     invoices.customer_id,
    //     invoices.amount,
    //     invoices.status
    //   FROM invoices
    //   WHERE invoices.id = ${id};
    // `;

    const data = await db.invoice.findUnique({
      select: {
        id: true,
        customer_id: true,
        amount: true,
        status: true,
      },
      where: {
        id: id,
      },
    });

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    noStore();
    const data = await db.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    const customers = data;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string): Promise<User | null> {
  try {
    return db.user.findFirst({
      where: {
        email: email,
      },
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}
