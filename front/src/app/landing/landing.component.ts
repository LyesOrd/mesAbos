// landing-page.component.ts
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { Card } from 'primeng/card';
import { Carousel } from 'primeng/carousel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { PrimeNG } from 'primeng/config';
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    Menubar,
    InputTextModule,
    Button,
    ImageModule,
    Card,
    Carousel,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    AvatarModule,
    AvatarGroupModule,
    AccordionModule,
    TextareaModule,
    MenuModule,
    DividerModule,
    TabsModule,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  // Pour le menu
  menuItems: MenuItem[] = [];
  footerMenuItems: MenuItem[] = [];

  // Pour l'autocomplete
  value: string = '';
  items: string[] = [];
  allItems: string[] = [
    'Design Responsive',
    'Interface intuitive',
    'Tableaux de bord',
    'Gestion des utilisateurs',
    'Authentification',
    'Sécurité avancée',
    'Rapports',
    'Statistiques',
    'Gestion de droits',
    'Mode sombre',
    'Notifications',
    'Stockage cloud',
    'Partage de fichiers',
    'Exportation PDF',
    'Exportation Excel',
    'API REST',
    'Support 24/7',
    'Mise à jour automatique',
    'Sauvegarde',
    'Multi-langues',
  ];

  // Pour les fonctionnalités
  features = [
    {
      title: 'Performance',
      icon: 'pi pi-bolt',
      description:
        'Notre plateforme est optimisée pour offrir une expérience rapide et fluide à tous nos utilisateurs.',
    },
    {
      title: 'Sécurité',
      icon: 'pi pi-shield',
      description:
        'La sécurité de vos données est notre priorité absolue, avec un chiffrement de bout en bout.',
    },
    {
      title: 'Responsive',
      icon: 'pi pi-mobile',
      description:
        "Profitez d'une expérience optimale sur tous vos appareils grâce à notre design responsive.",
    },
  ];

  // Pour les témoignages
  testimonials = [
    {
      name: 'Marie Dupont',
      role: 'CEO, Company ABC',
      image: 'https://via.placeholder.com/150',
      comment:
        'Cette plateforme a transformé notre façon de travailler. Tout est plus simple et plus rapide maintenant.',
    },
    {
      name: 'Pierre Martin',
      role: 'CTO, StartUp XYZ',
      image: 'https://via.placeholder.com/150',
      comment:
        'Le support client est exceptionnel. Nos problèmes sont toujours résolus rapidement.',
    },
    {
      name: 'Sophie Leblanc',
      role: 'Manager, Enterprise DEF',
      image: 'https://via.placeholder.com/150',
      comment:
        "L'interface est intuitive et agréable à utiliser. Même nos employés les moins techniques s'y sont adaptés facilement.",
    },
    {
      name: 'Jean Dubois',
      role: 'Developer, Tech Co.',
      image: 'https://via.placeholder.com/150',
      comment:
        "La documentation technique est complète et bien structurée. L'intégration a été un jeu d'enfant.",
    },
  ];

  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1,
    },
  ];

  // Pour la section pricing
  pricingPlans = [
    {
      name: 'Gratuit',
      monthlyPrice: 0,
      features: [
        'Accès limité',
        '1 utilisateur',
        'Support communautaire',
        'Fonctionnalités de base',
      ],
      recommended: false,
    },
    {
      name: 'Standard',
      monthlyPrice: 29,
      features: [
        'Accès complet',
        '5 utilisateurs',
        'Support email',
        'Toutes les fonctionnalités',
      ],
      recommended: true,
    },
    {
      name: 'Premium',
      monthlyPrice: 99,
      features: [
        'Accès complet',
        'Utilisateurs illimités',
        'Support prioritaire 24/7',
        'Fonctionnalités avancées',
      ],
      recommended: false,
    },
  ];

  // Pour la FAQ
  faqItems = [
    {
      question: 'Comment puis-je commencer à utiliser la plateforme ?',
      answer:
        'Il vous suffit de vous inscrire en utilisant votre adresse email. Vous recevrez ensuite un email de confirmation avec les instructions pour créer votre premier projet.',
    },
    {
      question: "Est-ce que je peux essayer gratuitement avant de m'abonner ?",
      answer:
        "Oui, nous proposons une période d'essai gratuite de 14 jours. Vous pouvez explorer toutes les fonctionnalités sans engagement.",
    },
    {
      question: 'Comment fonctionne la facturation ?',
      answer:
        "Nous proposons des formules d'abonnement mensuel ou annuel. Vous pouvez payer par carte bancaire ou PayPal.",
    },
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer:
        "Oui, vous pouvez annuler votre abonnement à tout moment. Vous continuerez à bénéficier du service jusqu'à la fin de la période en cours.",
    },
    {
      question: 'Proposez-vous un support technique ?',
      answer:
        "Oui, nous offrons un support technique par email pour tous nos clients. Les clients Premium bénéficient également d'un support téléphonique prioritaire.",
    },
  ];

  constructor(private primeng: PrimeNG) {}

  ngOnInit(): void {
    this.initMenus();
    this.primeng.ripple.set(true);
  }

  initMenus(): void {
    // Menu principal
    this.menuItems = [
      {
        label: 'Accueil',
        icon: 'pi pi-home',
        routerLink: ['/home'],
      },
      {
        label: 'Fonctionnalités',
        icon: 'pi pi-star',
        routerLink: ['/features'],
      },
      {
        label: 'Témoignages',
        icon: 'pi pi-comments',
        routerLink: ['/testimonials'],
      },
      {
        label: 'Tarifs',
        icon: 'pi pi-tag',
        routerLink: ['/pricing'],
      },
      {
        label: 'FAQ',
        icon: 'pi pi-question-circle',
        routerLink: ['/faq'],
      },
      {
        label: 'Contact',
        icon: 'pi pi-envelope',
        routerLink: ['/contact'],
      },
    ];

    // Menu du footer
    this.footerMenuItems = [
      { label: 'Accueil', icon: 'pi pi-home', url: '#' },
      { label: 'Services', icon: 'pi pi-briefcase', url: '#' },
      { label: 'À propos', icon: 'pi pi-info-circle', url: '#' },
      { label: 'Blog', icon: 'pi pi-book', url: '#' },
      { label: 'Contact', icon: 'pi pi-envelope', url: '#' },
    ];
  }

  /**
   * Méthode de recherche pour l'autocomplétion
   * @param event L'événement de saisie contenant la requête
   */
  search(event: any): void {
    // Filtrer les éléments en fonction de la requête saisie
    const query = event.query.toLowerCase();

    // Filtrer les éléments qui contiennent la requête
    this.items = this.allItems.filter((item) =>
      item.toLowerCase().includes(query)
    );
  }

  /**
   * Méthode pour gérer la sélection d'un élément
   * @param event L'élément sélectionné
   */
  onSelect(event: any): void {
    console.log('Élément sélectionné:', event);
    // Vous pouvez ajouter ici une logique supplémentaire
  }

  /**
   * Méthode pour effacer la sélection
   */
  onClear(): void {
    this.value = '';
  }
}
