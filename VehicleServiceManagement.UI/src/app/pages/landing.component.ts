import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit {
    @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

    ngAfterViewInit() {
        const video = this.heroVideo?.nativeElement;
        if (video) {
            video.muted = true;
            video.play().catch(() => {
                document.addEventListener('click', () => video.play(), { once: true });
            });
        }
    }

    services = [
        { icon: 'wrench', title: 'General Service', desc: 'Complete vehicle maintenance and tune-ups' },
        { icon: 'tire', title: 'Tire Service', desc: 'Rotation, alignment, and replacement' },
        { icon: 'battery', title: 'Battery Service', desc: 'Testing, charging, and replacement' },
        { icon: 'paint', title: 'Body Work', desc: 'Dent repair, painting, and detailing' },
        { icon: 'snowflake', title: 'AC Service', desc: 'Climate control repair and maintenance' },
        { icon: 'bolt', title: 'Electrical', desc: 'Diagnostics and electrical repairs' }
    ];

    whyChooseUs = [
        { icon: 'shield-check', title: 'Certified Experts', desc: 'Factory-trained technicians with years of experience' },
        { icon: 'clock', title: 'Fast Turnaround', desc: 'Quick service delivery without compromising quality' },
        { icon: 'wallet', title: 'Transparent Pricing', desc: 'No hidden fees, upfront quotes before work begins' },
        { icon: 'award', title: '12-Month Warranty', desc: 'All services backed by comprehensive warranty coverage' },
        { icon: 'location', title: 'Real-time Tracking', desc: 'Track your service status live from anywhere' },
        { icon: 'car', title: 'All Brands', desc: 'Expert service for all vehicle makes and models' }
    ];

    reviews = [
        { name: 'John Smith', rating: 5, text: 'Excellent service! My car runs like new. Highly recommend their team.', avatar: 'JS' },
        { name: 'Sarah Johnson', rating: 5, text: 'Professional, fast, and affordable. Best auto service in town!', avatar: 'SJ' },
        { name: 'Mike Chen', rating: 5, text: 'The tracking feature is amazing. I knew exactly when my car was ready.', avatar: 'MC' },
        { name: 'Emily Davis', rating: 5, text: 'Transparent pricing and quality work. They earned a customer for life.', avatar: 'ED' },
        { name: 'Robert Wilson', rating: 5, text: 'Outstanding attention to detail. My vehicle has never looked better!', avatar: 'RW' },
        { name: 'Lisa Martinez', rating: 5, text: 'Quick turnaround and excellent communication throughout the process.', avatar: 'LM' }
    ];

    faqs = [
        { q: 'How do I book a service?', a: 'Simply sign up, add your vehicle, and select the service you need. Our team will handle the rest.', open: false },
        { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, UPI, and cash payments.', open: false },
        { q: 'How long does a typical service take?', a: 'Most services are completed within 2-4 hours. Complex repairs may take 1-2 days.', open: false },
        { q: 'Do you provide pickup and drop service?', a: 'Yes! We offer free pickup and drop for services above a certain value.', open: false },
        { q: 'Is there a warranty on repairs?', a: 'All our repairs come with a 12-month warranty on parts and labor.', open: false }
    ];

    carBrands = ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Ford', 'Audi', 'Hyundai', 'Nissan', 'Volkswagen', 'Kia'];

    toggleFaq(index: number) {
        this.faqs[index].open = !this.faqs[index].open;
    }
}
