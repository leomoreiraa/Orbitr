# Orbitr

Orbitr é uma aplicação web de Kanban para gestão visual de tarefas e colaboração. Combina um backend RESTful em Java (Spring Boot) com um frontend em Angular. O objetivo é oferecer um espaço centralizado para criação, atribuição, acompanhamento e discussão de tarefas em quadros Kanban colaborativos.

**Principais conceitos e funcionalidades**
- **Quadros (Boards):** organizar tarefas por projetos ou contextos, com múltiplas colunas e filtros.
- **Tarefas (Tasks):** títulos, descrições, comentários, anexos, etiquetas e datas de vencimento.
- **Colaboração:** compartilhamento de quadros com permissões básicas (visualização/edição).
- **Notificações e e-mail:** envio de notificações por e-mail para verificação e alertas.
- **Autenticação:** gerenciamento de usuários com autenticação baseada em JWT.

**Arquitetura**
- **Backend:** aplicação Spring Boot (Java, Maven) expondo APIs REST, camadas de serviço, repositório (JPA/Hibernate) e configuração para integrações (SMTP, WebSocket/Realtime).
- **Banco de dados:** PostgreSQL (configurado para ambiente local via `docker-compose.yml` no diretório `backend`).
- **Frontend:** Single Page Application em Angular com componentes para quadros, listas de tarefas, formulários e diálogos.

**Tecnologias principais**
- Java 21 + Spring Boot (REST, segurança, JPA)
- Hibernate / Spring Data JPA
- PostgreSQL
- Angular (versão recente)
- Docker / Docker Compose (opcional para ambiente de banco)

**Estrutura do repositório**
- `backend/` — código fonte do serviço Java (Maven), configuração e exemplos de ambiente.
- `frontend/` — código fonte do cliente Angular, componentes e assets.

**Notas importantes**
- Arquivos de ambiente (por exemplo `.env`) podem conter credenciais sensíveis e não devem ser versionados.
- O projeto foi reestruturado para separar claramente backend e frontend e tornar o repositório adequado para publicação.

**Contribuição e contato**
- Pull requests e issues são bem-vindos. Para alterações significativas, abra uma issue descrevendo a proposta antes de implementar.
- Se precisar de suporte rápido ou integração (CI/CD, publicação), descreva o objetivo e eu posso ajudar a preparar os artefatos necessários.

**Licença**
- O repositório não contém uma licença explícita por padrão. Se pretende torná-lo público, escolha e adicione uma licença apropriada (por exemplo MIT, Apache-2.0) conforme a política do projeto.

---

Se quiser, eu adapto esse texto ao tom que preferir (mais técnico, mais comercial ou mais resumido) ou crio uma seção específica de arquitetura técnica com diagramas e endpoints principais.
