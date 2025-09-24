import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="min-h-screen bg-[var(--bg)]">
    <header class="flex items-center justify-between px-8 py-6 bg-[var(--surface)]/95 backdrop-blur-lg border-b border-[var(--border)] shadow-sm">
  <div class="flex items-center gap-4 text-2xl font-bold tracking-tight">
  <img src="icon.png" alt="Orbitr" class="w-16 h-16 rounded-xl">
        <span class="bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] bg-clip-text text-transparent">Orbitr</span>
      </div>
      <nav class="flex items-center gap-4">
        <a routerLink="/login" class="text-[var(--text-soft)] hover:text-[var(--text)] font-medium transition px-4 py-2 rounded-lg hover:bg-[var(--bg-soft)]">Entrar</a>
        <a routerLink="/register" class="btn btn-sm">Registrar</a>
      </nav>
    </header>

    <main class="container mx-auto px-8 py-12">
      <main class="max-w-5xl mx-auto px-6 py-12">
        <div class="hero text-center mb-12 relative">
          <div class="hero-decor" aria-hidden="true"></div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">Organize seus projetos<br><span class="text-[var(--brand)]">com Orbitr</span></h1>
          <p class="text-[var(--text-soft)] max-w-2xl mx-auto mb-6">Uma ferramenta leve e colaborativa para equipes que querem menos reuniões e mais entregas. Crie boards, convide colaboradores e acompanhe o progresso em tempo real.</p>
          <div class="flex items-center justify-center gap-4 mb-10">
            <a routerLink="/register" class="btn btn-gradient px-8 py-3">Comece a usar gratuitamente</a>
            <a routerLink="/login" class="btn btn-ghost px-6 py-3">Entrar</a>
          </div>

          <!-- small fake cards (kept as requested) -->
          <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left">
              <h4 class="font-semibold mb-2">Kanban Intuitivo</h4>
              <p class="text-[var(--text-soft)]">Arraste, ordene e priorize tarefas com facilidade.</p>
            </div>
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left">
              <h4 class="font-semibold mb-2">Colaboração em tempo real</h4>
              <p class="text-[var(--text-soft)]">Veja atualizações instantâneas feitas por sua equipe.</p>
            </div>
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-left">
              <h4 class="font-semibold mb-2">Notificações por Email</h4>
              <p class="text-[var(--text-soft)]">Templates prontos e envio confiável para manter todos informados.</p>
            </div>
          </div>

          <!-- compact mockboard matching screenshot -->
          <div class="mx-auto max-w-full bg-[var(--surface)] rounded-2xl p-6 shadow border border-[var(--border)]">
            <div class="overflow-x-auto -mx-2">
              <div class="min-w-[900px] flex gap-6 px-2">
                <!-- Column: A Fazer -->
                <div class="w-72 bg-[var(--bg-soft)] rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="w-3 h-3 rounded-full" style="background:#f59e0b"></span>
                    <h5 class="font-semibold text-sm">A Fazer (3)</h5>
                  </div>
                  <div class="space-y-4">
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                      <div class="font-medium text-sm">Criar wireframes para o novo aplicativo</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Design</div>
                    </div>
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                      <div class="font-medium text-sm">Realizar pesquisa de usuários</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Pesquisa</div>
                    </div>
                  </div>
                </div>

                <!-- Column: Em Progresso -->
                <div class="w-72 bg-[var(--bg-soft)] rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="w-3 h-3 rounded-full" style="background:#3b82f6"></span>
                    <h5 class="font-semibold text-sm">Em Progresso (3)</h5>
                  </div>
                  <div class="space-y-4">
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                      <div class="font-medium text-sm">Desenvolver o protótipo de alta fidelidade</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Desenvolvimento</div>
                    </div>
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm">
                      <div class="font-medium text-sm">Testar o protótipo com usuários</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Testes</div>
                    </div>
                  </div>
                </div>

                <!-- Column: Concluído -->
                <div class="w-72 bg-[var(--bg-soft)] rounded-xl p-4">
                  <div class="flex items-center gap-3 mb-3">
                    <span class="w-3 h-3 rounded-full" style="background:#10b981"></span>
                    <h5 class="font-semibold text-sm">Concluído (3)</h5>
                  </div>
                  <div class="space-y-4">
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm opacity-90">
                      <div class="font-medium text-sm">Concluir o design de interface do usuário</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Design</div>
                    </div>
                    <div class="bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-sm opacity-90">
                      <div class="font-medium text-sm">Apresentar o design final</div>
                      <div class="text-[var(--text-soft)] text-xs mt-2">Apresentação</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="max-w-4xl mx-auto text-center mb-12">
          <h2 class="text-2xl font-semibold mb-6">Recursos que impulsionam sua produtividade</h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <div class="w-10 h-10 rounded-full bg-[var(--bg-soft)] mx-auto mb-4 flex items-center justify-center">📋</div>
              <h3 class="font-semibold mb-2">Gerenciamento de Tarefas</h3>
              <p class="text-[var(--text-soft)]">Crie, priorize e mova tarefas com facilidade.</p>
            </div>
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <div class="w-10 h-10 rounded-full bg-[var(--bg-soft)] mx-auto mb-4 flex items-center justify-center">🤝</div>
              <h3 class="font-semibold mb-2">Colaboração em Equipe</h3>
              <p class="text-[var(--text-soft)]">Atualizações em tempo real e permissões de acesso.</p>
            </div>
            <div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <div class="w-10 h-10 rounded-full bg-[var(--bg-soft)] mx-auto mb-4 flex items-center justify-center">📈</div>
              <h3 class="font-semibold mb-2">Acompanhamento de Progresso</h3>
              <p class="text-[var(--text-soft)]">Visualize o progresso e identifique bloqueios rapidamente.</p>
            </div>
          </div>
        </section>

        <section class="bg-[var(--bg-soft)] border-t border-[var(--border)] py-12 px-6 rounded-xl text-center mb-12">
          <h3 class="text-xl font-semibold mb-3">Pronto para decolar?</h3>
          <p class="text-[var(--text-soft)] max-w-2xl mx-auto mb-6">Experimente Orbitr gratuitamente e veja como sua equipe ganha foco e velocidade.</p>
          <a routerLink="/register" class="btn btn-gradient px-8 py-3">Comece hoje mesmo</a>
        </section>

        <footer class="text-center text-[var(--text-soft)] mt-12 py-6">
          <div class="max-w-4xl mx-auto space-y-2">
            <div>© {{ year }} Orbitr — Todos os direitos reservados.</div>
          </div>
        </footer>
      </main>
    </main>
  </div>
  `,
  styles: []
})
export class HomeComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);
  year = new Date().getFullYear();

  createBoard(){
    if(!this.auth.isAuthenticated()) { this.router.navigateByUrl('/login'); return; }
    const ref = this.dialog.open(CreateBoardDialogComponent,{disableClose:true});
    ref.afterClosed().subscribe(r=>{ if(r?.nome){ this.router.navigateByUrl('/board'); } });
  }

  goBoards(){
    if(!this.auth.isAuthenticated()) { this.router.navigateByUrl('/login'); return; }
    this.router.navigateByUrl('/board');
  }

  goEmailTest(){
    this.router.navigateByUrl('/email-test');
  }
}
