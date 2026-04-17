-- Add family/care fields to LeaveRequest (for 子の看護等休暇・介護休暇 申出書)
ALTER TABLE "LeaveRequest" ADD COLUMN "familyName" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "familyBirthdate" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "familyRelationship" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "adoptionDate" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "specialAdoptionDate" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "careReason" TEXT;
