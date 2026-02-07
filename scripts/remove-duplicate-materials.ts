import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

async function removeDuplicateMaterials() {
  try {
    console.log('重複材料の削除を開始します...')

    // すべての材料を取得
    const allMaterials = await prisma.material.findMany({
      orderBy: { createdAt: 'asc' }, // 作成日時の古い順
    })

    console.log(`総材料数: ${allMaterials.length}件`)

    // 材料名でグループ化
    const materialsByName = new Map<string, typeof allMaterials>()

    for (const material of allMaterials) {
      const existing = materialsByName.get(material.name)
      if (existing) {
        existing.push(material)
      } else {
        materialsByName.set(material.name, [material])
      }
    }

    // 重複している材料名を処理
    let deletedCount = 0
    for (const [name, materials] of materialsByName.entries()) {
      if (materials.length > 1) {
        console.log(`\n"${name}" が ${materials.length}件 重複しています`)

        // 最初の1件を残して、それ以外を削除
        const toKeep = materials[0]
        const toDelete = materials.slice(1)

        console.log(`  保持: ${toKeep.id} (作成日時: ${toKeep.createdAt})`)

        for (const material of toDelete) {
          console.log(`  削除: ${material.id} (作成日時: ${material.createdAt})`)
          await prisma.material.delete({
            where: { id: material.id },
          })
          deletedCount++
        }
      }
    }

    console.log(`\n✅ 重複削除完了`)
    console.log(`削除した材料: ${deletedCount}件`)
    console.log(`残った材料: ${allMaterials.length - deletedCount}件`)

    // 最終確認
    const finalMaterials = await prisma.material.findMany({
      orderBy: { name: 'asc' },
    })

    console.log('\n最終的な材料リスト:')
    finalMaterials.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name} (状態: ${m.isActive ? '有効' : '無効'})`)
    })

  } catch (error) {
    console.error('エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicateMaterials()
