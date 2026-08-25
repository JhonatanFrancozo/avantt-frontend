import { useState } from 'react'
import Modal from '../components/Modal'
import ProjectPickerRow from '../components/ProjectPickerRow'
import { c } from '../core/theme'
import type { Member, Project } from '../core/types'

interface Props {
  member: Member
  projects: Project[]
  onClose: () => void
  onSave: (m: Member) => void
}

export default function EditMemberProjectsModal({ member, projects, onClose, onSave }: Props) {
  const [projList, setProjList] = useState<string[]>(member.projects)

  function toggleProject(pname: string) {
    setProjList((pl) => pl.includes(pname) ? pl.filter((x) => x !== pname) : [...pl, pname])
  }

  return (
    <Modal title={`Projetos de ${member.name}`} onClose={onClose} onSubmit={() => onSave({ ...member, projects: projList })} submitLabel="Salvar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>
          Selecione os projetos em que este membro está alocado.
        </div>
        {projects.map((p) => (
          <ProjectPickerRow key={p.id} project={p} selected={projList.includes(p.name)} onToggle={toggleProject} />
        ))}
      </div>
    </Modal>
  )
}



