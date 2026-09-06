import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'

type Props = {
  fileName: string | null
  onFileNameChange: (name: string | null) => void
}

// UI-only dropzone. No parsing yet — we just capture the file name for the request.
export function PdfUploadZone({ fileName, onFileNameChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { t } = useI18n()

  function accept(file: File | undefined) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are accepted in this placeholder.')
      return
    }
    onFileNameChange(file.name)
    toast.success('PDF attached', { description: `${file.name} — parsing arrives in a later phase.` })
  }

  return (
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
        dragging ? 'border-accent bg-accent/5' : 'border-hairline hover:border-slate-600 hover:bg-surface-2/40',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {fileName ? (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <FileText className="h-4 w-4 text-accent" />
          <span className="font-mono">{fileName}</span>
          <button
            type="button"
            data-testid="pdf-remove-button"
            onClick={(e) => {
              e.stopPropagation()
              onFileNameChange(null)
            }}
            className="rounded p-0.5 text-slate-500 hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <UploadCloud className="mb-2 h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-300">{t('pdf.drop')}</p>
          <p className="mt-0.5 text-xs text-slate-600">{t('pdf.placeholder')}</p>
        </>
      )}
    </div>
  )
}
