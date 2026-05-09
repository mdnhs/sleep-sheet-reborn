-- CreateEnum
CREATE TYPE "TestimonialUserRole" AS ENUM ('FASHION_ENTHUSIAST', 'CUSTOMER', 'INFLUENCER', 'OTHER');

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "role" "TestimonialUserRole" NOT NULL DEFAULT 'CUSTOMER';
