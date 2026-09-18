import { useRef, useState } from 'react'
import { FileText, UploadCloud, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'

type Props = {
  file: File | null
  onFileChange: (file: File | null) => void
  onAnalyze: () => void
  analyzing: boolean
}

const MAX_FILE_SIZE = 20 * 1024 * 1024

export function PdfUploadZone({
  file,
  onFileChange,
  onAnalyze,
  analyzing,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { t } = useI18n()

  function accept(selectedFile: File | undefined) {
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error(t('pdf.onlyPdf'))
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(t('pdf.tooLarge'), { description: t('pdf.maxSize') })
      return
    }

    onFileChange(selectedFile)

    toast.success(t('pdf.attached'), { description: selectedFile.name })
  }

  return (
    <div className="space-y-3">
      <div
        data-testid="pdf-upload-dropzone"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          accept(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
          dragging
            ? 'border-accent bg-accent/5'
            : 'border-hairline hover:border-slate-600 hover:bg-surface-2/40',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <FileText className="h-4 w-4 text-accent" />

            <span className="max-w-[260px] truncate font-mono">
              {file.name}
            </span>

            <button
              type="button"
              data-testid="pdf-remove-button"
              onClick={(e) => {
                e.stopPropagation()
                onFileChange(null)

                if (inputRef.current) {
                  inputRef.current.value = ''
                }
              }}
              className="rounded p-0.5 text-slate-500 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="mb-2 h-6 w-6 text-slate-500" />

            <p className="text-sm text-slate-300">
              {t('pdf.drop')}
            </p>

            <p className="mt-0.5 text-xs text-slate-600">
              {t('pdf.placeholder')}
            </p>
          </>
        )}
      </div>

      <button
        type="button"
        disabled={!file || analyzing}
        onClick={(e) => {
          e.stopPropagation()
          onAnalyze()
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" />
        {analyzing ? t('pdf.analyzing') : t('pdf.analyze')}
      </button>
    </div>
  )
}