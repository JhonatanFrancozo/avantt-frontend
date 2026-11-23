import { useEffect, useState } from 'react';
import { listarStatus, type Status } from '../service/statusService';

export function TesteStatus() {
  const [status, setStatus] = useState<Status[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarStatus()
      .then(setStatus)
      .catch((error) => {
        console.error('Erro ao buscar status:', error);
        setErro('Não foi possível carregar os status.');
      });
  }, []);

  return (
    <div>
      <h2>Status das tarefas</h2>

      {erro && <p>{erro}</p>}

      {status.map((item) => (
        <div key={item.id}>
          <h3>{item.nome}</h3>
          <p>{item.descricao}</p>
        </div>
      ))}
    </div>
  );
}
