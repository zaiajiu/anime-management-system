import { useState, useRef } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createAnime } from "@/api/anime"
import logger from '@/utils/logger';
import { toast } from 'sonner'; // ★ 引入

export default function AddAnimeDialog({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState({
    animeName: "",
    animeIntroduction: "",
    animeComment: "",
  })
  const [coverFile, setCoverFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  const resetForm = () => {
    setForm({ animeName: "", animeIntroduction: "", animeComment: "" })
    setCoverFile(null)
    setPreview("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleClose = () => {
    if (submitting) return
    resetForm()
    onOpenChange(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("请选择图片文件")
    if (file.size > 5 * 1024 * 1024) return toast.error("图片不能超过 5MB")
    setCoverFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.animeName.trim()) return toast.error("请输入动漫名称")

    try {
      setSubmitting(true)
      const res = await createAnime({ ...form, image: coverFile })
      if (!res.success) {
        toast.error(res.message)
        return
      }else{
        toast.success("新建成功")
      }
      onSuccess?.(res.data)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error("新建失败：" + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加动漫</DialogTitle>
          <DialogDescription>填写动漫信息，封面可选</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">封面</Label>
            <Input id="image" type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} />
            {preview && (
              <img src={preview} alt="预览"
                   className="mt-2 w-32 aspect-[3/4] object-cover rounded-md border" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="animeName">动漫名称</Label>
            <Input id="animeName" placeholder="请输入动漫名称"
                   value={form.animeName}
                   onChange={(e) => setForm({ ...form, animeName: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="animeIntroduction">简介</Label>
            <Textarea id="animeIntroduction" rows={4} placeholder="简单介绍一下"
                      value={form.animeIntroduction}
                      onChange={(e) => setForm({ ...form, animeIntroduction: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="animeComment">观后感</Label>
            <Textarea id="animeComment" rows={4} placeholder="写下你的观后感"
                      value={form.animeComment}
                      onChange={(e) => setForm({ ...form, animeComment: e.target.value })} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "确定新建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}