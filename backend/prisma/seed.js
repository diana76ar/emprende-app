import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba
  const testUser = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: {
      email: 'test@test.com',
      password: await bcrypt.hash('123456', 10),
      plan: 'free'
    }
  });

  console.log('✅ Usuario de prueba creado:', testUser);

  // Crear producto de prueba
  const testProduct = await prisma.product.create({
    data: {
      userId: testUser.id,
      name: 'Producto Test',
      type: 'digital',
      costBase: 1000,
      costShipping: 0,
      costCommission: 200,
      costOther: 0,
      margin: 1300
    }
  });

  console.log('✅ Producto de prueba creado:', testProduct);

  // Crear ventas de prueba
  for (let i = 0; i < 5; i++) {
    const sale = await prisma.sale.create({
      data: {
        userId: testUser.id,
        productId: testProduct.id,
        quantity: 2 + i,
        price: 2500,
        profit: 3000 + (i * 500),
        date: new Date(Date.now() - i * 86400000) // Últimos 5 días
      }
    });
    console.log(`✅ Venta ${i + 1} creada`);
  }

  console.log('\n🎉 Seed completado. Puedes ingresar con:');
  console.log('📧 Email: test@test.com');
  console.log('🔑 Password: 123456');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
