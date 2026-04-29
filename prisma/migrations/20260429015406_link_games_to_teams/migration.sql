-- AlterTable
ALTER TABLE "games" ADD COLUMN     "awayTeamId" TEXT,
ADD COLUMN     "homeTeamId" TEXT;

-- CreateIndex
CREATE INDEX "games_homeTeamId_idx" ON "games"("homeTeamId");

-- CreateIndex
CREATE INDEX "games_awayTeamId_idx" ON "games"("awayTeamId");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
