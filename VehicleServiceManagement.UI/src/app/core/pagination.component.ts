import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
        <div class="d-flex align-items-center gap-3">
            <span class="text-muted">
                Showing {{ startItem }}-{{ endItem }} of {{ totalItems }} items
            </span>
            <div class="d-flex align-items-center gap-2">
                <label class="text-muted small mb-0">Items per page:</label>
                <select class="form-select form-select-sm" style="width: auto;" 
                    [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)">
                    <option [value]="5">5</option>
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                </select>
            </div>
        </div>
        <nav aria-label="Pagination">
            <ul class="pagination pagination-sm mb-0">
                <!-- First Page -->
                <li class="page-item" [class.disabled]="currentPage === 1">
                    <button class="page-link" (click)="goToPage(1)" [disabled]="currentPage === 1" title="First Page">
                        <i class="bi bi-chevron-double-left"></i>
                    </button>
                </li>
                <!-- Previous Page -->
                <li class="page-item" [class.disabled]="currentPage === 1">
                    <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1" title="Previous">
                        <i class="bi bi-chevron-left"></i>
                    </button>
                </li>
                
                <!-- Page Numbers -->
                @for (page of visiblePages; track page) {
                    @if (page === -1) {
                        <li class="page-item disabled">
                            <span class="page-link">...</span>
                        </li>
                    } @else {
                        <li class="page-item" [class.active]="page === currentPage">
                            <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
                        </li>
                    }
                }
                
                <!-- Next Page -->
                <li class="page-item" [class.disabled]="currentPage === totalPages">
                    <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages" title="Next">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                </li>
                <!-- Last Page -->
                <li class="page-item" [class.disabled]="currentPage === totalPages">
                    <button class="page-link" (click)="goToPage(totalPages)" [disabled]="currentPage === totalPages" title="Last Page">
                        <i class="bi bi-chevron-double-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    `,
    styles: [`
        .pagination .page-link {
            border-radius: 0.375rem;
            margin: 0 2px;
            min-width: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pagination .page-item.active .page-link {
            background-color: var(--bs-primary);
            border-color: var(--bs-primary);
        }
    `]
})
export class PaginationComponent {
    @Input() currentPage = 1;
    @Input() pageSize = 10;
    @Input() totalItems = 0;

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    }

    get startItem(): number {
        if (this.totalItems === 0) return 0;
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    get endItem(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalItems);
    }

    get visiblePages(): number[] {
        const pages: number[] = [];
        const total = this.totalPages;
        const current = this.currentPage;
        const delta = 2;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            let start = Math.max(2, current - delta);
            let end = Math.min(total - 1, current + delta);
            if (start > 2) {
                pages.push(-1);
            }
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (end < total - 1) {
                pages.push(-1);
            }
            pages.push(total);
        }

        return pages;
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }

    onPageSizeChange(newSize: number) {
        this.pageSizeChange.emit(+newSize);
    }
}
