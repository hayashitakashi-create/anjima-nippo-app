import { redirect } from 'next/navigation'

export default function Home() {
  // ルートページにアクセスした場合、常にログインページにリダイレクト
  redirect('/login')
}
