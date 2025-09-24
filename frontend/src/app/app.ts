import { Component, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { BoardStateService } from './services/board-state.service';
import { FilterService } from './services/filter.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from './components/create-board-dialog/create-board-dialog.component';
import { BoardService, BoardDto } from './services/board.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('task-manager-frontend');
  auth = inject(AuthService);
  theme = inject(ThemeService);
  boardsState = inject(BoardStateService);
  filters = inject(FilterService);
  sidebarOpen = signal(false);
  private dialog = inject(MatDialog);
  private boardService = inject(BoardService);
  boardMenuOpenId = signal<number | null>(null);
  private router = inject(Router);

  logout(ev: Event) {
    ev.preventDefault();
    this.auth.clearToken();
    this.router.navigate(['/home']);
  }

  toggleSidebar() { this.sidebarOpen.set(!this.sidebarOpen()); }

  openCreateBoardDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, { disableClose: true });
    ref.afterClosed().subscribe(result => {
      if (result?.nome) {
        this.boardService.createBoard(result.nome, result.icon).subscribe({
          next: b => { 
            // Recarrega boards e seleciona após carregar
            this.boardsState.add(b, () => this.boardsState.select(b.id));
          },
          error: err => console.error('Erro criar board', err)
        });
      }
    });
  }

  async openShareDialog() {
    const currentId = this.boardsState.currentBoardId();
    if (!currentId) return;
    
    const currentBoard = this.boardsState.boards().find((b: BoardDto) => b.id === currentId);
    if (!currentBoard) return;

    // Import dinâmico para evitar problemas de dependência circular
    const module = await import('./components/board-share-dialog/board-share-dialog.component');
    const ref = this.dialog.open(module.BoardShareDialogComponent, {
      width: '600px',
      data: { board: currentBoard }
    });
  }

  constructor() {
    // Reage às mudanças no estado de autenticação
    effect(() => {
      const isAuth = this.auth.authChanged();
      if (isAuth && this.isBoardRoute()) {
        
        this.boardsState.loadBoards();
      } else if (!isAuth) {
        
      }
    });
  }

  isBoardRoute() {
    return this.router.url.startsWith('/board');
  }

  currentBoardId() {
    return this.boardsState.currentBoardId();
  }

  currentBoardName() {
    const id = this.boardsState.currentBoardId();
    if (!id) return 'Sem board';
    const b = this.boardsState.boards().find(x => x.id === id);
    return b?.nome || 'Sem board';
  }

  toggleBoardMenu(ev: Event, id: number) {
    ev.stopPropagation();
    this.boardMenuOpenId.set(this.boardMenuOpenId() === id ? null : id);
  }

  renameBoard(ev: Event, b: BoardDto) {
    ev.stopPropagation();
    const nome = prompt('Renomear board:', b.nome);
    if (!nome || nome === b.nome) return;
    this.boardService.renameBoard(b.id, nome).subscribe({
      next: upd => { this.boardsState.update(upd); this.boardMenuOpenId.set(null); },
      error: err => console.error('Erro renomear', err)
    });
  }

  deleteBoard(ev: Event, b: BoardDto) {
    ev.stopPropagation();
    if (!confirm('Excluir este board e suas colunas?')) return;
    this.boardService.deleteBoard(b.id).subscribe({
      next: () => { this.boardsState.remove(b.id); this.boardMenuOpenId.set(null); },
      error: err => console.error('Erro excluir', err)
    });
  }

  triggerAddColumn() {
    if (!this.boardsState.currentBoardId()) return;
    window.dispatchEvent(new CustomEvent('open-new-column-form'));
  }

  clickOutsideHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.board-menu-trigger')) this.boardMenuOpenId.set(null);
  };

  ngOnInit() {
    if (typeof document !== 'undefined') document.addEventListener('click', this.clickOutsideHandler);
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') document.removeEventListener('click', this.clickOutsideHandler);
  }
}
