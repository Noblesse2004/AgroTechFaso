/* =============================================================================
   AgroTech Faso — main.js
   -----------------------------------------------------------------------------
   Vanilla, sans dependance, environ 15 Ko non minifie, dont la moitié en
   commentaires. Cinq comportements :

     1. Menu mobile accessible (ouverture, fermeture, piege de focus, Echap).
     2. Apparition des blocs au defilement, desactivee si le visiteur prefere
        moins d'animations.
     3. Facade video : aucune requete vers la plateforme tierce avant le clic.
     4. Formulaire de contact : verifie dans le navigateur, affiche un
        recapitulatif et prepare un message. Aucun serveur n'est appele.
     5. FAQ : une seule reponse ouverte a la fois.

   Le script s'execute avec l'attribut defer : le DOM est deja pret.
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------------------------------------------------------------------
     1. Menu mobile
     --------------------------------------------------------------------------- */

  function initMenu() {
    var bouton = document.getElementById("bouton-menu");
    var panneau = document.getElementById("nav-panneau");
    if (!bouton || !panneau) {
      return;
    }

    var lienDuMenu = function () {
      return panneau.querySelector("a[href], button:not([disabled])");
    };

    var focusables = function () {
      return Array.prototype.filter.call(
        panneau.querySelectorAll("a[href], button:not([disabled])"),
        function (el) {
          return el.offsetParent !== null;
        }
      );
    };

    function ouvrir() {
      panneau.hidden = false;
      bouton.setAttribute("aria-expanded", "true");
      var premier = lienDuMenu();
      if (premier) {
        premier.focus();
      }
      document.addEventListener("keydown", surTouche);
    }

    function fermer(rendoreFocus) {
      panneau.hidden = true;
      bouton.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", surTouche);
      if (rendoreFocus) {
        bouton.focus();
      }
    }

    function estOuvert() {
      return !panneau.hidden;
    }

    function surTouche(evenement) {
      if (evenement.key === "Escape") {
        evenement.preventDefault();
        fermer(true);
        return;
      }

      if (evenement.key !== "Tab") {
        return;
      }

      /* Piege de focus : tant que le panneau est ouvert, la tabulation reste
         a l'interieur. Sans ce bloc, le focus passerait derriere le panneau
         et le clavier pourrait disparaitre de l'ecran. */
      var liste = focusables();
      if (liste.length === 0) {
        return;
      }

      var premier = liste[0];
      var dernier = liste[liste.length - 1];

      if (evenement.shiftKey && document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
      } else if (!evenement.shiftKey && document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
      }
    }

    bouton.addEventListener("click", function () {
      if (estOuvert()) {
        fermer(true);
      } else {
        ouvrir();
      }
    });

    /* Un clic sur un lien du panneau ferme le menu : le focus doit revenir au
       bouton, sinon il resterait dans un panneau devenu invisible. */
    panneau.addEventListener("click", function (evenement) {
      if (evenement.target.closest("a[href]")) {
        fermer(false);
      }
    });

    /* Un clic dehors ferme aussi. */
    document.addEventListener("click", function (evenement) {
      if (estOuvert() && !panneau.contains(evenement.target) && !bouton.contains(evenement.target)) {
        fermer(false);
      }
    });

    /* Si la fenetre s'elargit au-dessus du point de bascule, le panneau est
       masque par CSS : on remet l'etat en coherence pour le lecteur d'ecran. */
    var grandEcran = window.matchMedia("(min-width: 62rem)");
    function surResize(liste) {
      if (liste.matches && estOuvert()) {
        fermer(false);
      }
    }
    if (typeof grandEcran.addEventListener === "function") {
      grandEcran.addEventListener("change", surResize);
    } else if (typeof grandEcran.addListener === "function") {
      grandEcran.addListener(surResize);
    }
  }

  /* ---------------------------------------------------------------------------
     2. Apparition au defilement
     --------------------------------------------------------------------------- */

  function initRevele() {
    var elements = document.querySelectorAll(".revele");
    if (elements.length === 0) {
      return;
    }

    function montrer() {
      elements.forEach(function (el) {
        el.classList.add("est-visible");
      });
    }

    /* Le CSS masque les blocs via « .js .revele ». Si le script echoue apres
       cette classe, le contenu resterait invisible : on montre tout. */
    if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
      montrer();
      return;
    }

    var observateur = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            entree.target.classList.add("est-visible");
            observateur.unobserve(entree.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    elements.forEach(function (el) {
      observateur.observe(el);
    });

    /* Si le visiteur change d'avis sur les animations en cours de visite, on
       ne laisse rien cache. */
    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", function (evenement) {
        if (evenement.matches) {
          montrer();
        }
      });
    }
  }

  /* ---------------------------------------------------------------------------
     3. Facade video
     ---------------------------------------------------------------------------
     Remplacer l'attribut data-video du bouton #video-cadre par l'identifiant de
     la video reelle, par exemple data-video="aBcD1234". Tant qu'il est vide, un
     message s'affiche a la place du lecteur : mieux vaut un avertissement
     honnete qu'un embed casse.
     --------------------------------------------------------------------- */

  var EMPLACEMENT_LECTEUR =
    "https://www.youtube-nocookie.com/embed/";

  function initVideo() {
    var cadre = document.getElementById("video-cadre");
    if (!cadre) {
      return;
    }

    cadre.addEventListener("click", function () {
      var identifiant = (cadre.getAttribute("data-video") || "").trim();

      if (!identifiant) {
        var avis = document.createElement("p");
        avis.className = "video__introuvable";
        avis.setAttribute("role", "status");
        avis.textContent =
          "La vidéo n'est pas encore en ligne. Écrivez-nous et nous vous l'enverrons, ou demandez à voir une démonstration sur place.";
        var bloc = document.querySelector(".video__texte");
        if (bloc) {
          bloc.appendChild(avis);
        }
        return;
      }

      var lecteur = document.createElement("div");
      lecteur.className = "video__lecteur";

      var iframe = document.createElement("iframe");
      iframe.src = EMPLACEMENT_LECTEUR + encodeURIComponent(identifiant) + "?rel=0";
      iframe.title = "AgroTech Faso en deux minutes";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";

      lecteur.appendChild(iframe);
      cadre.parentNode.replaceChild(lecteur, cadre);
      iframe.focus();
    });
  }

  /* ---------------------------------------------------------------------------
     4. Formulaire de contact
     ---------------------------------------------------------------------------
     Aucune donnee n'est transmise. Le script verifie les champs, affiche le
     recapitulatif, puis construit un lien mailto: que le visiteur peut
     lui-meme envoyer. Pour une version qui enregistre vraiment les demandes,
     brancher un service de formulaire cote serveur et remplacer
     construireLienMessagerie() par l'appel a ce service.
     --------------------------------------------------------------------- */

  function construireLienMessagerie(donnees) {
    var objet = donnees.profil === "investisseur"
      ? "Demande d'information investisseur"
      : "Demande d'information capteur";

    var corps = [
      "Nom : " + donnees.nom,
      "Téléphone : " + donnees.telephone,
      "Parcelle : " + (donnees.parcelle || "non précisée"),
      "",
      donnees.message
    ].join("\n");

    return "mailto:contact@agrotech-faso.bf?subject=" +
      encodeURIComponent(objet) +
      "&body=" + encodeURIComponent(corps);
  }

  function initFormulaire() {
    var formulaire = document.getElementById("formulaire");
    if (!formulaire) {
      return;
    }

    var champNom = document.getElementById("nom");
    var champTelephone = document.getElementById("telephone");
    var champParcelle = document.getElementById("parcelle");
    var champMessage = document.getElementById("message");
    var blocRetour = document.getElementById("formulaire-retour");
    var texteRecap = document.getElementById("formulaire-recap");
    var lienMessagerie = document.getElementById("lien-messagerie");

    function afficherErreur(champ, message) {
      var zone = document.getElementById("erreur-" + champ.id);
      if (!zone) {
        return;
      }
      if (message) {
        zone.textContent = message;
        zone.hidden = false;
        champ.setAttribute("aria-invalid", "true");
      } else {
        zone.textContent = "";
        zone.hidden = true;
        champ.removeAttribute("aria-invalid");
      }
    }

    function valider() {
      var premier = null;

      if (!champNom.value.trim()) {
        afficherErreur(champNom, "Indiquez votre nom, pour que nous sachions qui vous rappeler.");
        premier = premier || champNom;
      } else {
        afficherErreur(champNom, "");
      }

      /* On retire espaces, points et tirets avant de compter les chiffres :
         un numero saisi avec des separatesurs ne doit pas etre refuse. */
      var chiffres = champTelephone.value.replace(/[\s.\-]/g, "");
      if (!chiffres) {
        afficherErreur(champTelephone, "Indiquez un numéro de téléphone.");
        premier = premier || champTelephone;
      } else if (chiffres.length < 8) {
        afficherErreur(champTelephone, "Ce numéro semble incomplet. Exemple : 70 12 34 56.");
        premier = premier || champTelephone;
      } else {
        afficherErreur(champTelephone, "");
      }

      if (!champMessage.value.trim()) {
        afficherErreur(champMessage, "Écrivez deux mots sur votre parcelle ou votre projet.");
        premier = premier || champMessage;
      } else {
        afficherErreur(champMessage, "");
      }

      if (premier) {
        premier.focus();
      }

      return !premier;
    }

    /* On valide au moment où le visiteur quitte le champ, pas pendant qu'il
       tape : une erreur affichée au premier caractère est pénible. */
    [champNom, champTelephone, champMessage].forEach(function (champ) {
      champ.addEventListener("blur", function () {
        if (champ.value.trim()) {
          afficherErreur(champ, "");
        }
      });
    });

    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();

      if (!valider()) {
        return;
      }

      var profil = formulaire.querySelector('input[name="profil"]:checked');
      var donnees = {
        nom: champNom.value.trim(),
        telephone: champTelephone.value.trim(),
        parcelle: champParcelle.value.trim(),
        message: champMessage.value.trim(),
        profil: profil ? profil.value : "producteur"
      };

      texteRecap.textContent =
        donnees.nom + ", " + donnees.telephone +
        (donnees.parcelle ? ", parcelle à " + donnees.parcelle : "") + ".";

      lienMessagerie.setAttribute("href", construireLienMessagerie(donnees));
      blocRetour.hidden = false;
      blocRetour.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "nearest"
      });
    });
  }

  /* ---------------------------------------------------------------------------
     5. FAQ : une seule reponse ouverte
     ---------------------------------------------------------------------------
     Le balisage utilise <details>, donc la page reste lisible sans JavaScript
     et le clavier fonctionne nativement. Le script n'ajoute que l'exclusivite :
     ouvrir une question referme les autres, comme un vrai accordeon.

     On ferme les freres au moment de l'ouverture et non a la fermeture : si
     le visiteur ouvre une question, l'ancienne peut disparaitre derriere, ce
     qui evite de deplacer le focus pendant qu'il lit.
     --------------------------------------------------------------------- */

  function initFaq() {
    var bloc = document.querySelector(".faq");
    if (!bloc) {
      return;
    }

    var questions = bloc.querySelectorAll("details");

    questions.forEach(function (question) {
      question.addEventListener("toggle", function () {
        if (!question.open) {
          return;
        }
        questions.forEach(function (autre) {
          if (autre !== question) {
            autre.open = false;
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------------
     6. Filet de securite et ombre au defilement
     --------------------------------------------------------------------------- */

  function initEntete() {
    var entete = document.getElementById("entete");
    if (!entete) {
      return;
    }

    function majEtat() {
      entete.classList.toggle("est-defile", window.scrollY > 8);
    }

    majEtat();
    window.addEventListener("scroll", majEtat, { passive: true });
  }

  /* ---------------------------------------------------------------------------
     Année du copyright, pour ne pas avoir a le corriger tous les janvier.
     --------------------------------------------------------------------- */

  function initAnnee() {
    var cible = document.getElementById("annee");
    if (cible) {
      cible.textContent = String(new Date().getFullYear());
    }
  }

  /* ---------------------------------------------------------------------------
     9. Sequences d'animation des illustrations
     ---------------------------------------------------------------------------
     Les elements marques « data-anime » jouent une sequence quand ils entrent
     dans l'ecran : une courbe qui se trace, une impulsion qui descend la tige,
     les barres de repartition qui se remplissent.

     Le CSS porte l'etat de repos : sans JavaScript, sans IntersectionObserver,
     ou avec le mouvement reduit, la page affiche deja les dessins complets.
     Ce script ne fait donc qu'ajouter le mouvement, jamais le contenu. Il
     n'y a rien a rattraper si l'observateur echoue, et rien a nettoyer.

     Chaque element n'est observe qu'une fois, puis libere.
     --------------------------------------------------------------------- */

  function initSequences() {
    var elements = document.querySelectorAll("[data-anime]");
    if (elements.length === 0) {
      return;
    }

    if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
      return;
    }

    var observateur = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            entree.target.classList.add("anime-depart");
            observateur.unobserve(entree.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.2 }
    );

    elements.forEach(function (el) {
      observateur.observe(el);
    });

    if (typeof prefersReducedMotion.addEventListener === "function") {
      prefersReducedMotion.addEventListener("change", function (evenement) {
        if (evenement.matches) {
          elements.forEach(function (el) {
            el.classList.add("anime-depart");
          });
        }
      });
    }
  }

  function init() {
    initEntete();
    initMenu();
    initRevele();
    initVideo();
    initFormulaire();
    initFaq();
    initAnnee();
    initSequences();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
