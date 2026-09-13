import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cardTitleClass, sectionHeadingClass } from "@/lib/page-typography";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { PlanChoiceLink } from "@/components/molecules/plan-choice-link";
import { cn } from "@/lib/utils";
import { PlanUpgradeRequestForm } from "@/components/organisms/plan-upgrade-request-form";

/*
  Trois façons de remplir une case coexistaient dans un même `string` : le mot
  « check » commandait une icône, le tiret cadratin commandait une case vide, et
  tout le reste s'affichait tel quel. Une coquille sur l'un de ces deux mots
  magiques ne déclenchait donc aucune erreur : elle basculait dans le troisième
  cas et partait s'imprimer telle quelle dans le comparatif. Les trois cas sont
  désormais distincts pour le compilateur.
*/
type Cellule =
  | { sorte: "inclus" }
  | { sorte: "absent" }
  | { sorte: "detail"; texte: string };

const INCLUS: Cellule = { sorte: "inclus" };
const ABSENT: Cellule = { sorte: "absent" };
const detail = (texte: string): Cellule => ({ sorte: "detail", texte });

/*
  Le comparatif écrivait « Incluse » sur quatre lignes, dont trois portent un
  nom masculin : « Dashboard manager : Incluse », « Calibrage coach : Incluse »,
  « KISS Management : Incluse ». Un marqueur d'état ne s'accorde avec rien, et
  il ne peut donc plus se tromper d'accord d'une ligne à l'autre.
*/
const comparisonRows: {
  label: string;
  starter: Cellule;
  team: Cellule;
  entreprise: Cellule;
}[] = [
  {
    label: "Analyse de RDV",
    starter: detail("Illimité"),
    team: detail("Illimité"),
    entreprise: detail("Illimité"),
  },
  {
    label: "CR + mail de suivi",
    starter: INCLUS,
    team: INCLUS,
    entreprise: INCLUS,
  },
  { label: "Coaching", starter: INCLUS, team: INCLUS, entreprise: INCLUS },
  {
    label: "Coaching KISS inclus",
    starter: INCLUS,
    team: INCLUS,
    entreprise: INCLUS,
  },
  { label: "SalesScore", starter: INCLUS, team: INCLUS, entreprise: INCLUS },
  {
    label: "Préparation du RDV",
    starter: INCLUS,
    team: INCLUS,
    entreprise: INCLUS,
  },
  {
    label: "Vue manager",
    starter: ABSENT,
    team: INCLUS,
    entreprise: INCLUS,
  },
  {
    label: "Dashboard manager",
    starter: ABSENT,
    team: INCLUS,
    entreprise: INCLUS,
  },
  {
    label: "Calibrage coach",
    starter: ABSENT,
    team: INCLUS,
    entreprise: detail("Complet et personnalisable"),
  },
  {
    label: "KISS Management",
    starter: detail("Basique"),
    team: INCLUS,
    entreprise: detail("Complet et personnalisable"),
  },
  /*
    Une case répétait l'intitulé de sa propre ligne : « Sièges manager » puis
    « Sièges manager illimités ». Sur téléphone, ce doublon passait à trois
    lignes et faisait de cette rangée la plus haute du comparatif, pour une
    information tenant en un mot.
  */
  {
    label: "Sièges manager",
    starter: detail("1 siège"),
    team: detail("Illimités"),
    entreprise: detail("Sur mesure"),
  },
];

function ValeurCellule({ valeur }: { valeur: Cellule }) {
  if (valeur.sorte === "inclus") {
    return (
      /*
        L'icône seule ne disait rien : un lecteur d'écran entendait la ligne
        « Vue manager », puis un silence, puis « Incluse ». Le mot porte
        désormais l'information et l'icône n'est plus qu'un repère visuel, d'où
        `aria-hidden` pour ne pas l'annoncer deux fois.

        `emerald-700` et non `600` : le vert ne teintait qu'une icône, à qui le
        contraste minimal des textes ne s'applique pas. Devenu du texte, il doit
        le tenir sur fond blanc.
      */
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="size-4 shrink-0" aria-hidden="true" />
        Inclus
      </span>
    );
  }
  if (valeur.sorte === "absent") {
    /*
      La case portait un simple tiret. Le prospect qui compare voyait trois
      tirets dans la colonne Starter sans savoir s'il manquait une donnée ou la
      fonctionnalité, et un lecteur d'écran n'annonçait rien du tout.
    */
    return <span className="text-muted-foreground">Non inclus</span>;
  }
  return <span className="text-sm">{valeur.texte}</span>;
}

export function CompanyPlanPageContent() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <PageHeaderSimple
        title="Choisissez le forfait qui vous convient"
        description="Trois offres pour les commerciaux solo, les équipes managées et les grands comptes. Toutes incluent l'analyse de rendez-vous et le coaching KISS."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className={cardTitleClass}>Starter</CardTitle>
            <CardDescription>Commercial solo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">49&nbsp;€</p>
              <p className="text-muted-foreground text-sm">
                par utilisateur / mois
              </p>
            </div>
            <p className="text-sm font-medium text-foreground dark:text-neutral-300">
              Max. 5 utilisateurs
            </p>
            <PlanChoiceLink
              forfait="Starter"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-full",
              )}
            >
              Choisir ce plan
            </PlanChoiceLink>
          </CardContent>
        </Card>

        <Card className="border-brand/40 shadow-md ring-1 ring-brand/20 dark:border-brand/50">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Team</CardTitle>
              {/*
                Marque pâle sur marque pâle : la pastille tenait 4,13:1 en clair
                et 4,48:1 en sombre, sous les 4,5:1 exigés à cette taille. C'est
                pourtant le seul repère qui désigne le forfait mis en avant.
                L'aplat devient plein, ce qui la rend lisible et plus visible.
              */}
              <span className="bg-brand text-brand-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                Populaire
              </span>
            </div>
            <CardDescription>Équipe managée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">79&nbsp;€</p>
              <p className="text-muted-foreground text-sm">
                par utilisateur / mois
              </p>
            </div>
            <p className="text-sm font-medium text-foreground dark:text-neutral-300">
              Max. 50 utilisateurs
            </p>
            {/*
              Le bouton de conversion principal du produit écrivait son texte en
              blanc en dur. En thème sombre, --brand s'éclaircit pour rester
              lisible en texte, et ce blanc n'y tenait plus que 3,27:1, sous les
              4,5:1 exigés. Il porte désormais l'encre appariée à l'aplat, comme
              --primary-foreground se pose sur --primary.
            */}
            <PlanChoiceLink
              forfait="Team"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-brand hover:bg-brand-hover text-brand-foreground h-9 w-full",
              )}
            >
              Choisir ce plan
            </PlanChoiceLink>
          </CardContent>
        </Card>

        <Card className="border-border dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className={cardTitleClass}>Entreprise</CardTitle>
            <CardDescription>Grands comptes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">Sur devis</p>
              <p className="text-muted-foreground text-sm">
                Facturation sur mesure
              </p>
            </div>
            <p className="text-sm font-medium text-foreground dark:text-neutral-300">
              Plus de 50 utilisateurs
            </p>
            <PlanChoiceLink
              forfait="Entreprise"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-full",
              )}
            >
              Nous contacter
            </PlanChoiceLink>
          </CardContent>
        </Card>
      </div>

      <PlanUpgradeRequestForm />

      <div className="space-y-3">
        <h2 className={sectionHeadingClass}>Comparatif détaillé</h2>
        <div className="overflow-x-auto rounded-xl border border-border dark:border-neutral-800">
          {/*
            Quatre colonnes ne tiennent pas sur un téléphone : le tableau garde
            donc son défilement horizontal. La largeur minimale baisse sous
            « sm », où les intitulés peuvent passer à la ligne, pour que la
            colonne Team reste visible sans faire glisser le tableau.
          */}
          <table className="w-full min-w-[440px] border-collapse text-left text-sm sm:min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="px-4 py-3 font-medium text-muted-foreground dark:text-neutral-400">
                  Fonctionnalité
                </th>
                <th className="px-4 py-3 font-semibold text-foreground dark:text-neutral-100">
                  Starter
                </th>
                <th className="text-brand px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold text-foreground dark:text-neutral-100">
                  Entreprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-neutral-800">
              {comparisonRows.map((row) => (
                <tr
                  key={row.label}
                  className="bg-card hover:bg-muted/80 dark:bg-neutral-950 dark:hover:bg-neutral-900/40"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-normal text-foreground dark:text-neutral-300"
                  >
                    {row.label}
                  </th>
                  {/*
                    Les valeurs étaient centrées sous des en-têtes alignés à
                    gauche, jusqu'à « sm » seulement : la colonne changeait donc
                    d'alignement en cours de route, et ne s'accordait avec son
                    titre à aucune largeur en dessous.
                  */}
                  <td className="px-4 py-3">
                    <ValeurCellule valeur={row.starter} />
                  </td>
                  {/*
                    La colonne du forfait mis en avant est teintée. Le même 4 %
                    ne produit pas le même écart selon le fond : sur du blanc il
                    donne un lavande visible, sur le noir du thème sombre il
                    passait de rgb(10,10,10) à rgb(15,15,20), soit rien du tout.
                    La teinte est donc dosée par thème, comme le sont déjà
                    --brand-soft et --brand-ring juste à côté.
                  */}
                  <td className="bg-brand/[0.04] dark:bg-brand/[0.10] px-4 py-3">
                    <ValeurCellule valeur={row.team} />
                  </td>
                  <td className="px-4 py-3">
                    <ValeurCellule valeur={row.entreprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
