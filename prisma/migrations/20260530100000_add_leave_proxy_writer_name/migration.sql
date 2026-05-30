-- AlterTable: 休暇届に代理記入者の実名カラムを追加（共有アカウント対応・田邊様5/28 FB A）
ALTER TABLE "LeaveRequest" ADD COLUMN "proxyWriterName" TEXT;
