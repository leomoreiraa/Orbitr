import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

const EMOJI_CATEGORIES = {
  'Trabalho': ['�','📊','📈','📉','�📋','�','�🗂️','📁','🔍','⚙️','🛠️','💻','📱','⌚','🖥️','⌨️','🖱️','💾','💿','📺','📷','📹','🎥','📽️','🎬','📻','🎙️','�','☎️'],
  'Projetos': ['�🚀','🎯','🔥','⭐','💡','🧪','🔬','🎨','🎭','🎪','🎨','🏗️','🏭','🏢','🏬','🏦','🏪','🏫','🏛️','⛪','🕌','🕍','⛩️','🛕'],
  'Organização': ['�','📆','🗓️','⏰','⏲️','⏱️','�️','�','📍','🔖','🏷️','📎','�️','�','📏','✂️','🗃️','🗄️','🗂️','📋','📊','�📈','�'],
  'Diversão': ['🎮','🕹️','🎲','🃏','🎴','🎪','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎼','🎹','🥁','🎸','🎺','🎷','🎻','🎪','🎡','🎢','🎠','🎟️','🎫'],
  'Natureza': ['🌱','🌿','🍀','🌳','🌲','🌴','🌵','🌾','🌺','🌻','🌹','🌷','🌸','💐','🌼','🌙','⭐','🌟','💫','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️'],
  'Comida': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','�','🍈','🍒','🥭','🍑','🍐','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒'],
  'Personalizar': []
};

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Novo Board</h2>
    <form (ngSubmit)="confirm()" novalidate class="space-y-6">
      <div class="space-y-2">
        <label for="board-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Board</label>
        <input 
          id="board-name" 
          type="text" 
          [ngModel]="name()" 
          (ngModelChange)="name.set($event)" 
          name="name" 
          required 
          minlength="2" 
          placeholder="Ex: Planejamento 2024" 
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
        />
      </div>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Ícone</span>
          <button 
            type="button" 
            (click)="showCustomInput = !showCustomInput" 
            class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ showCustomInput ? 'Escolher da lista' : 'Digitar emoji' }}
          </button>
        </div>
        
        <!-- Input customizado -->
        <div *ngIf="showCustomInput" class="space-y-2">
          <input 
            type="text" 
            [ngModel]="customEmoji()" 
            (ngModelChange)="setCustomEmoji($event)"
            placeholder="Cole ou digite um emoji 🎨" 
            maxlength="2"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl"
          />
        </div>
        
        <!-- Seleção de categorias e emojis -->
        <div *ngIf="!showCustomInput" class="space-y-3">
          <div class="flex flex-wrap gap-1">
            <button 
              type="button" 
              *ngFor="let category of getCategories()" 
              (click)="selectedCategory = category"
              [class]="'px-3 py-1 text-xs rounded-full border transition-colors ' + (selectedCategory === category ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600')"
            >
              {{ category }}
            </button>
          </div>
          
          <div class="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <button 
              type="button" 
              *ngFor="let e of getCurrentEmojis()" 
              (click)="select(e)" 
              [class]="'w-8 h-8 text-lg hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center ' + (icon() === e ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' : '')"
            >
              {{ e }}
            </button>
          </div>
        </div>
        
        <!-- Preview do ícone selecionado -->
        <div *ngIf="icon() || customEmoji()" class="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span class="text-3xl">{{ icon() || customEmoji() }}</span>
        </div>
      </div>
      
      <div class="flex gap-3 pt-4">
        <button 
          type="button" 
          (click)="close()" 
          class="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          [disabled]="!valid()" 
          class="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Criar
        </button>
      </div>
    </form>
  </div>
  `,
  styles: []
})
export class CreateBoardDialogComponent {
  private ref = inject(MatDialogRef<CreateBoardDialogComponent>);
  emojiCategories = EMOJI_CATEGORIES;
  name = signal('');
  icon = signal<string|undefined>(undefined);
  customEmoji = signal('');
  selectedCategory = 'Trabalho';
  showCustomInput = false;

  getCategories() {
    return Object.keys(this.emojiCategories);
  }

  getCurrentEmojis() {
    return this.emojiCategories[this.selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];
  }

  select(e: string) { 
    this.icon.set(e); 
    this.customEmoji.set('');
  }

  setCustomEmoji(emoji: string) {
    const cleanEmoji = emoji.trim();
    this.customEmoji.set(cleanEmoji);
    if (cleanEmoji) {
      this.icon.set(cleanEmoji);
    }
  }

  valid() { 
    return this.name().trim().length >= 2; 
  }

  confirm() { 
    if (!this.valid()) return; 
    const finalIcon = this.customEmoji() || this.icon();
    this.ref.close({ nome: this.name().trim(), icon: finalIcon }); 
  }

  close() { 
    this.ref.close(null); 
  }
}
