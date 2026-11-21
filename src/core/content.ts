/**
 * Centralização de todos os textos da interface.
 * Altere aqui para mudar qualquer label, placeholder ou mensagem.
 * No futuro: substituir por i18n (react-intl, i18next) se necessário.
 */

export const txt = {
  // ── Navegação ────────────────────────────────────────────────────────────────
  nav: {
    visaoGeral: 'Visão Geral',
    projetos: 'Projetos',
    sprints: 'Sprints',
    backlog: 'Backlog',
    equipe: 'Equipe',
    relatorios: 'Relatórios',
  },

  // ── Títulos de página ────────────────────────────────────────────────────────
  pagina: {
    visaoGeral: 'Visão Geral do Gestor',
    projetos: 'Projetos',
    sprints: 'Sprints',
    backlog: 'Backlog',
    equipe: 'Equipe',
    relatorios: 'Relatórios',
  },

  // ── Botões ───────────────────────────────────────────────────────────────────
  btn: {
    novoProjeto: '＋ Novo Projeto',
    novaSprint: '＋ Nova Sprint',
    novaTarefa: '＋ Nova Tarefa',
    adicionarMembro: '＋ Adicionar Membro',
    salvar: 'Salvar',
    cancelar: 'Cancelar',
    fechar: 'Fechar',
    editarProjetos: 'Editar projetos atribuídos',
    verDetalhes: '▼ Ver detalhes',
    ocultarDetalhes: '▲ Ocultar',
  },

  // ── Modais ───────────────────────────────────────────────────────────────────
  modal: {
    criarProjeto: {
      titulo: 'Novo Projeto',
      nome: 'Nome do Projeto',
      descricao: 'Descrição',
      cor: 'Cor',
      dataInicio: 'Data de Início',
      dataFim: 'Data de Término',
      equipe: 'Equipe',
      placeholderNome: 'Ex: Portal do Cliente B2B',
      placeholderDescricao: 'Descreva o objetivo do projeto',
    },
    criarTarefa: {
      titulo: 'Nova Tarefa',
      nome: 'Título da Tarefa',
      projeto: 'Projeto',
      sprint: 'Sprint',
      responsavel: 'Responsável',
      prioridade: 'Prioridade',
      status: 'Status',
      prazo: 'Prazo',
      horas: 'Horas Estimadas',
      bloqueadoPor: 'Bloqueado Por (motivo)',
      tags: 'Tags',
      placeholderNome: 'Ex: Integração SSO com Active Directory',
      placeholderTag: 'Adicionar tag e pressionar Enter',
      placeholderBloqueio: 'Descreva o motivo do bloqueio',
      selecioneProjeto: 'Selecione um projeto',
      selecioneSprint: 'Selecione uma sprint',
      nenhumaSprint: 'Nenhuma sprint disponível',
    },
    criarSprint: {
      titulo: 'Nova Sprint',
      nome: 'Nome da Sprint',
      projeto: 'Projeto',
      dataInicio: 'Data de Início',
      dataFim: 'Data de Fim',
      objetivo: 'Objetivo da Sprint',
      equipe: 'Equipe',
      placeholderNome: 'Ex: Sprint 15',
      placeholderObjetivo: 'O que será entregue nesta sprint?',
    },
    criarMembro: {
      titulo: 'Novo Membro',
      nome: 'Nome Completo',
      email: 'E-mail',
      cargo: 'Cargo / Função',
      cor: 'Cor do Avatar',
      cargaTrabalho: 'Carga de Trabalho (%)',
      projetos: 'Projetos',
      placeholderNome: 'Ex: João Silva',
      placeholderEmail: 'joao.silva@empresa.com',
    },
    editarProjetosMembro: {
      titulo: 'Projetos de',
    },
  },

  // ── Filtros / labels de seleção ──────────────────────────────────────────────
  filtro: {
    todos: 'Todos',
    todasSprints: 'Todas as Sprints',
    todosProjetos: 'Todos os Projetos',
    todosMembros: 'Todos os Membros',
    todasPrioridades: 'Todas as Prioridades',
    todosStatus: 'Todos os Status',
    projeto: 'Projeto',
    sprint: 'Sprint',
    responsavel: 'Responsável',
    prioridade: 'Prioridade',
    status: 'Status',
    funcao: 'Função',
    buscar: 'Buscar tarefas…',
  },

  // ── Visão Geral ──────────────────────────────────────────────────────────────
  overview: {
    tarefasAtrasadas: 'Tarefas Atrasadas',
    sprintsAtrasadas: 'Sprints em Atraso',
    taxaConclusao: 'Taxa de Conclusão',
    tarefasBloqueadas: 'Tarefas Bloqueadas',
    dias: 'dias',
    diaSingular: 'dia',
    horas: 'h estimadas',
    sprintMaisAtrasada: 'Sprint Mais Atrasada',
    tarefasMaisAtrasadas: 'Tarefas com Maior Atraso',
    responsavelPorTarefa: 'Quem está fazendo o quê',
    semAtrasos: 'Nenhuma tarefa em atraso!',
    deXtarefas: (n: number) => `de ${n} tarefa${n !== 1 ? 's' : ''}`,
    atrasoMedio: (d: number) => `Atraso médio: ${d} dia${d !== 1 ? 's' : ''}`,
    sprintsEmAtraso: (n: number, total: number) => `${n} de ${total} sprint${total !== 1 ? 's' : ''}`,
  },

  // ── Projetos ─────────────────────────────────────────────────────────────────
  projetos: {
    subtitulo: 'Clique em um projeto para ver detalhes',
    progresso: 'Progresso',
    semDescricao: 'Sem descrição',
    marcos: 'Marcos',
    riscos: 'Riscos',
    distribuicaoTarefas: 'Distribuição de Tarefas',
    nenhumMarco: 'Nenhum marco definido.',
    nenhumRisco: 'Nenhum risco identificado.',
    gasto: 'gasto',
    planejado: 'planejado',
    sprints: 'Sprints',
    tarefas: 'Tarefas',
    atrasadas: 'Atrasadas',
    bloqueadas: 'Bloqueadas',
    concluidas: 'Concluídas',
    canceladas: 'Canceladas',
    total: 'Total',
    atrasado: 'ATRASADO',
    nProjetos: (n: number) => `${n} projeto${n !== 1 ? 's' : ''}`,
  },

  // ── Sprints ──────────────────────────────────────────────────────────────────
  sprints: {
    objetivo: 'Objetivo',
    periodo: 'Período',
    progresso: 'Progresso',
    equipe: 'Equipe',
    tarefas: 'Tarefas',
    bloqueadas: 'Bloqueadas',
    concluidas: 'Concluídas',
    total: 'Total',
    emAtraso: 'EM ATRASO',
    nenhumaSprint: 'Nenhuma sprint cadastrada.',
  },

  // ── Backlog ───────────────────────────────────────────────────────────────────
  backlog: {
    visualizacaoLista: 'Lista',
    visualizacaoKanban: 'Kanban',
    nenhumaTarefa: 'Nenhuma tarefa encontrada.',
    sprint: 'Sprint',
    responsavel: 'Responsável',
    prazo: 'Prazo',
    horas: 'h',
    bloqueadaPor: 'Bloqueada:',
    atraso: 'dias de atraso',
    semSprint: 'Sem sprint',
  },

  // ── Equipe ───────────────────────────────────────────────────────────────────
  equipe: {
    totalMembros: 'Total de membros',
    sobrecarregados: 'Sobrecarregados',
    capacidadeMedia: 'Capacidade média',
    projetosAtivos: 'Projetos ativos',
    cargaTrabalho: 'Carga de trabalho',
    projetos: 'Projetos',
    nenhumProjeto: 'Nenhum projeto atribuído',
    sobrecarga: 'SOBRECARR.',
    cargaPct: (n: number) => `carga ≥ ${n}%`,
    daEquipe: 'da equipe',
    membro: (n: number) => `membro${n !== 1 ? 's' : ''}`,
  },

  // ── Relatórios ───────────────────────────────────────────────────────────────
  relatorios: {
    taxaConclusao: 'Taxa de conclusão',
    tarefasAtrasadas: 'Tarefas atrasadas',
    sprintsEmAtraso: 'Sprints em atraso',
    horasEstimadas: 'Horas estimadas',
    tarefasBloqueadas: 'Tarefas bloqueadas',
    requisitoAtencao: 'requerem atenção imediata',
    distribuicaoStatus: 'Distribuição por Status',
    tarefasPorProjeto: 'Tarefas por Projeto',
    tarefasPorPrioridade: 'Tarefas por Prioridade',
    tarefasPorMembro: 'Tarefas por Membro',
    cargaEquipe: 'Carga de Trabalho da Equipe',
    maiorAtraso: 'Tarefas com Maior Atraso',
    resumoSprints: 'Sprints — Resumo',
    semAtraso: 'Nenhuma tarefa atrasada! ✓',
    concluidas: 'concluídas',
    horas: 'h',
    sprintsResumoPct: (n: number, total: number) => `${n} de ${total} sprints`,
    atrasoMedio: (d: number) => `Atraso médio: ${d} dias`,
    horasConcluidas: (h: number, total: number) => `${h}h concluídas (${Math.round((h / (total || 1)) * 100)}%)`,
    concluirDe: (done: number, total: number) => `${done} de ${total} tarefas`,
  },

  // ── Labels de status e prioridade ────────────────────────────────────────────
  status: {
    planejada: 'Planejada',
    emAndamento: 'Em andamento',
    revisao: 'Revisão',
    bloqueada: 'Bloqueada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  },

  prioridade: {
    critica: 'Crítica',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
  },

  // ── Mensagens genéricas ───────────────────────────────────────────────────────
  geral: {
    carregando: 'Carregando…',
    erroAoCarregar: 'Erro ao carregar dados.',
    semDados: 'Nenhum dado disponível.',
    campoObrigatorio: 'Campo obrigatório',
    adicionarTag: 'Adicionar tag…',
  },
} as const


