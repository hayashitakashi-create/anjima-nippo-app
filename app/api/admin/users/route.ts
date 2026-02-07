import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireAdmin, authErrorResponse } from '@/lib/auth'

// ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        isActive: true,
        defaultReportType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// ユーザー新規作成
export async function POST(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { name, username, password, position, role, defaultReportType } = body

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: '氏名、ユーザー名、パスワードは必須です' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で設定してください' },
        { status: 400 }
      )
    }

    // ユーザー名の重複チェック
    const existing = await prisma.user.findUnique({
      where: { username },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        position: position || null,
        role: role || 'user',
        defaultReportType: defaultReportType || 'work',
      },
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        defaultReportType: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('ユーザー作成エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// ユーザー更新（権限変更など）
export async function PUT(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { userId, role, defaultReportType, position, isActive } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (defaultReportType !== undefined) updateData.defaultReportType = defaultReportType
    if (position !== undefined) updateData.position = position
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        isActive: true,
        defaultReportType: true,
      },
      data: updateData,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('ユーザー更新エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// ユーザー削除
export async function DELETE(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const admin = authResult.user

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    // 自分自身は削除できない
    if (userId === admin.id) {
      return NextResponse.json(
        { error: '自分自身は削除できません' },
        { status: 400 }
      )
    }

    // 紐づくデータの確認
    const [nippoCount, workReportCount] = await Promise.all([
      prisma.dailyReport.count({ where: { userId } }),
      prisma.workReport.count({ where: { userId } }),
    ])

    if (nippoCount > 0 || workReportCount > 0) {
      return NextResponse.json(
        {
          error: `このユーザーには営業日報${nippoCount}件、作業日報${workReportCount}件が紐づいています。先に日報を削除するか、アカウントを無効化してください。`,
          nippoCount,
          workReportCount,
        },
        { status: 400 }
      )
    }

    // 通知を先に削除
    await prisma.notification.deleteMany({ where: { userId } })

    // ユーザーを削除
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true, message: 'ユーザーを削除しました' })
  } catch (error) {
    console.error('ユーザー削除エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    )
  }
}
