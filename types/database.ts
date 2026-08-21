export type Role = 'admin' | 'annonceur' | 'commercant'
export type EcranStatut = 'actif' | 'hors_ligne' | 'maintenance'
export type CampagneStatut = 'draft' | 'en_attente' | 'active' | 'pause' | 'terminee'
export type MediaType = 'image' | 'video'
export type RevenuStatut = 'en_attente' | 'verse'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: Role
          nom: string
          telephone: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      boutiques: {
        Row: {
          id: string
          nom: string
          adresse: string | null
          zone: string | null
          commercant_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['boutiques']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['boutiques']['Insert']>
      }
      ecrans: {
        Row: {
          id: string
          boutique_id: string
          serial: string
          statut: EcranStatut
          derniere_synchro: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ecrans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ecrans']['Insert']>
      }
      medias: {
        Row: {
          id: string
          annonceur_id: string
          nom: string
          url: string
          type: MediaType
          duree_sec: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medias']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medias']['Insert']>
      }
      campagnes: {
        Row: {
          id: string
          annonceur_id: string
          nom: string
          media_id: string
          statut: CampagneStatut
          date_debut: string
          date_fin: string
          frequence_par_heure: number
          budget_fcfa: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['campagnes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['campagnes']['Insert']>
      }
      campagne_ecrans: {
        Row: { campagne_id: string; ecran_id: string }
        Insert: Database['public']['Tables']['campagne_ecrans']['Row']
        Update: Partial<Database['public']['Tables']['campagne_ecrans']['Row']>
      }
      impressions: {
        Row: {
          id: string
          campagne_id: string
          ecran_id: string
          diffusee_a: string
        }
        Insert: Omit<Database['public']['Tables']['impressions']['Row'], 'id' | 'diffusee_a'>
        Update: never
      }
      revenus: {
        Row: {
          id: string
          commercant_id: string
          mois: string
          montant_fcfa: number
          statut: RevenuStatut
          mode_paiement: string | null
          verse_le: string | null
        }
        Insert: Omit<Database['public']['Tables']['revenus']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['revenus']['Insert']>
      }
    }
  }
}
