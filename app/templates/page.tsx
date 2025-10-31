'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'

interface TemplateExercise {
  id: string
  exerciseId: string
  order: number
  exercise: {
    id: string
    name: string
    bodyPart: string
  }
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  exercises: TemplateExercise[]
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [startingTemplate, setStartingTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchTemplates()
    }
  }, [session?.user?.id])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data.templates)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = async (templateId: string) => {
    try {
      setStartingTemplate(templateId)
      const template = templates.find(t => t.id === templateId)

      if (!template || template.exercises.length === 0) {
        alert('このテンプレートには種目がありません')
        return
      }

      // Store template exercises in sessionStorage
      const exerciseIds = template.exercises.map(ex => ex.exercise.id)
      const exerciseNames = template.exercises.map(ex => ex.exercise.name)
      sessionStorage.setItem('templateExerciseIds', JSON.stringify(exerciseIds))
      sessionStorage.setItem('templateExerciseNames', JSON.stringify(exerciseNames))
      sessionStorage.setItem('currentTemplateIndex', '0')
      sessionStorage.setItem('templateName', template.name)
      sessionStorage.setItem('templateCompletedExercises', JSON.stringify([]))

      // Redirect to first exercise workout page
      const firstExerciseId = exerciseIds[0]
      router.push(`/workout/new?exerciseId=${firstExerciseId}&fromTemplate=true`)
    } catch (error: any) {
      alert(error.message || 'テンプレートの読み込みに失敗しました')
    } finally {
      setStartingTemplate(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return

    try {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('削除に失敗しました')

      fetchTemplates()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">📋 テンプレート</h1>
          </div>
          <Link
            href="/templates/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            + 作成
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 mb-2">テンプレートがありません</p>
            <p className="text-sm text-gray-400 mb-4">
              よく使うワークアウトを<br />
              テンプレートとして保存しましょう！
            </p>
            <Link
              href="/templates/new"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              最初のテンプレートを作成
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 mb-1">
                        {template.name}
                      </h2>
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {template.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        {template.exercises.length}種目
                      </div>
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div className="mt-4 space-y-2">
                    {template.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <span className="font-medium text-gray-900">
                          {ex.exercise.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ex.exercise.bodyPart}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleStartWorkout(template.id)}
                      disabled={startingTemplate === template.id}
                      className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:bg-gray-300"
                    >
                      {startingTemplate === template.id
                        ? '開始中...'
                        : 'ワークアウト開始'}
                    </button>
                    <Link
                      href={`/templates/${template.id}/edit`}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
