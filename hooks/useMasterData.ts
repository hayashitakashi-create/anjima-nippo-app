'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'

const DEFAULT_PROJECT_TYPES = [
  '建築塗装工事',
  '鋼橋塗装工事',
  '防水工事',
  '建築工事',
  '区画線工事',
]

const DEFAULT_WORKER_NAMES = [
  '古藤　英紀', '矢野　誠', '山内　正和', '大塚　崇', '中原　稔', '三嶋　晶',
  '伊藤　勝', '古曳　正樹', '松本　太', '佐野　弘和', '満田　純一', '齊藤　慰丈',
  '井原　晃', '松本　誠', '加藤　光', '堀内　光雄', '梶谷　純', '金藤　恵子',
  '安島　圭介', '山﨑　伸一', '足立　憲吉', '福田　誠', '安島　隆', '金山　昭徳',
  '安島　篤志', '松本　倫典', '田邊　沙帆', '古川　一彦', '内田　邦男', '藤原　秀夫',
  '田中　剛士', '小林　敬博', '福代　司', '池野　大樹', '中谷　凜大', '安部　倫太朗'
]

const DEFAULT_VOLUME_UNITS = ['ℓ', 'mℓ', 'm', '㎝']

const DEFAULT_SUBCONTRACTORS = [
  'キョウワビルト工業', '広野組', '又川工業', '景山工業',
  '森下塗装', '鳥島工業', '岩佐塗装', '恒松塗装'
]

export interface MaterialMasterItem {
  name: string
  unitPrice: number
  defaultVolume?: string
}

interface UseMasterDataOptions {
  materials?: boolean
  projectTypes?: boolean
  subcontractors?: boolean
  units?: boolean
  workers?: boolean
}

interface UseMasterDataResult {
  materialMasterList: MaterialMasterItem[]
  projectTypesList: string[]
  subcontractorMasterList: string[]
  unitMasterList: string[]
  workerNamesList: string[]
  loading: boolean
}

export function useMasterData(options: UseMasterDataOptions = {}): UseMasterDataResult {
  const {
    materials = true,
    projectTypes = true,
    subcontractors = true,
    units = true,
    workers = true,
  } = options

  const [materialMasterList, setMaterialMasterList] = useState<MaterialMasterItem[]>([])
  const [projectTypesList, setProjectTypesList] = useState<string[]>(DEFAULT_PROJECT_TYPES)
  const [subcontractorMasterList, setSubcontractorMasterList] = useState<string[]>(DEFAULT_SUBCONTRACTORS)
  const [unitMasterList, setUnitMasterList] = useState<string[]>(DEFAULT_VOLUME_UNITS)
  const [workerNamesList, setWorkerNamesList] = useState<string[]>(DEFAULT_WORKER_NAMES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const promises: Promise<any>[] = []
    const keys: string[] = []

    if (materials) {
      promises.push(adminApi.fetchMaterials().catch(() => null))
      keys.push('materials')
    }
    if (projectTypes) {
      promises.push(adminApi.fetchProjectTypes().catch(() => null))
      keys.push('projectTypes')
    }
    if (subcontractors) {
      promises.push(adminApi.fetchSubcontractors().catch(() => null))
      keys.push('subcontractors')
    }
    if (units) {
      promises.push(adminApi.fetchUnits().catch(() => null))
      keys.push('units')
    }
    if (workers) {
      promises.push(adminApi.fetchWorkers().catch(() => null))
      keys.push('workers')
    }

    if (promises.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(promises).then(results => {
      results.forEach((data, i) => {
        if (!data) return
        const key = keys[i]

        if (key === 'materials' && data.materials) {
          setMaterialMasterList(
            data.materials
              .filter((m: any) => m.isActive)
              .map((m: any) => ({
                name: m.name,
                unitPrice: m.defaultUnitPrice || 0,
                defaultVolume: m.defaultVolume || '',
              }))
          )
        }
        if (key === 'projectTypes' && data.projectTypes) {
          const activeTypes = data.projectTypes
            .filter((pt: any) => pt.isActive)
            .map((pt: any) => pt.name)
          if (activeTypes.length > 0) setProjectTypesList(activeTypes)
        }
        if (key === 'subcontractors' && data.subcontractors) {
          const activeNames = data.subcontractors
            .filter((s: any) => s.isActive)
            .map((s: any) => s.name)
          if (activeNames.length > 0) setSubcontractorMasterList(activeNames)
        }
        if (key === 'units' && data.units) {
          const activeUnits = data.units
            .filter((u: any) => u.isActive)
            .map((u: any) => u.name)
          if (activeUnits.length > 0) setUnitMasterList(activeUnits)
        }
        if (key === 'workers' && data.workers) {
          const activeWorkers = data.workers
            .filter((w: any) => w.isActive)
            .map((w: any) => w.name)
          if (activeWorkers.length > 0) setWorkerNamesList(activeWorkers)
        }
      })
    }).catch(err => {
      console.error('マスタデータ取得エラー:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [materials, projectTypes, subcontractors, units, workers])

  return {
    materialMasterList,
    projectTypesList,
    subcontractorMasterList,
    unitMasterList,
    workerNamesList,
    loading,
  }
}
