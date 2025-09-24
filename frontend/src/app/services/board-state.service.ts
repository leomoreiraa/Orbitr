import { Injectable, signal, computed, inject } from '@angular/core';
import { BoardService, BoardDto } from './board.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BoardStateService {
  private api = inject(BoardService);
  private auth = inject(AuthService);
  boards = signal<BoardDto[]>([]);
  ownBoards = signal<BoardDto[]>([]);
  sharedBoards = signal<BoardDto[]>([]);
  currentBoardId = signal<number | null>(null);
  loading = signal(false);

  currentBoard = computed(() => this.boards().find(b => b.id === this.currentBoardId()) || null);

  loadBoards(selectFirst = true) {
    // Verifica se o usuário está autenticado antes de fazer a chamada
    if (!this.auth.isAuthenticated()) {
      
      return;
    }

    
    this.loading.set(true);
    this.api.getBoardsSeparated().subscribe({
      next: result => { 
        
        
        // Atualiza os signals separados
        this.ownBoards.set(result.own);
        this.sharedBoards.set(result.shared);
        
        // Combina para compatibilidade
        const allBoards = [...result.own, ...result.shared];
        this.boards.set(allBoards); 
        
        if (selectFirst && !this.currentBoardId() && allBoards.length) this.currentBoardId.set(allBoards[0].id); 
        this.loading.set(false); 
      },
      error: err => { 
        console.error('❌ BoardStateService.loadBoards() - erro:', err); 
        this.loading.set(false); 
      }
    });
  }

  select(id: number) { if (this.currentBoardId() !== id) this.currentBoardId.set(id); }
  add(board: BoardDto, callback?: () => void) { 
    
    // Em vez de apenas adicionar ao cache local, recarregamos tudo do servidor
    // para garantir que boards compartilhados também sejam incluídos
    setTimeout(() => {
      // Verifica se o usuário ainda está autenticado antes de recarregar
      if (!this.auth.isAuthenticated()) {
        
        return;
      }

      
      this.loading.set(true);
      this.api.getBoardsSeparated().subscribe({
        next: result => { 
          
          
          // Atualiza os signals separados
          this.ownBoards.set(result.own);
          this.sharedBoards.set(result.shared);
          
          // Combina para compatibilidade
          const allBoards = [...result.own, ...result.shared];
          this.boards.set(allBoards); 
          this.loading.set(false);
          callback?.(); // Chama callback após carregar
        },
        error: err => { 
          console.error('❌ BoardStateService.add() - erro ao recarregar:', err); 
          this.loading.set(false); 
        }
      });
    }, 100);
  }
  update(board: BoardDto) { this.boards.set(this.boards().map(b => b.id===board.id? board: b)); }
  remove(id: number) { 
    this.boards.set(this.boards().filter(b => b.id!==id)); 
    if (this.currentBoardId()===id) this.currentBoardId.set(null); 
    // Recarrega do servidor após remover para manter sincronização, só se autenticado
    if (this.auth.isAuthenticated()) {
      this.loadBoards(false);
    }
  }
}
