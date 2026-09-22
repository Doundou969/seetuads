$path = ".\lib\services\media-order.service.ts"
$content = Get-Content $path -Raw

$old = @"
    await tx.mediaOrderItemScreen.createMany({
      data: lines.map((l) => ({
        orderItemId: item.id,
        screenId: l.screen.id,
        pricingRuleId: l.rule.id,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
        pricingSnapshot: { rule: l.rule, days },
      })),
    });

    // CampaignScreen[] / CampaignMedia[] volontairement NON créés ici :
    // matérialisés au passage PAID -> PROCESSING (Étape 4).
"@

$new = @"
    await tx.mediaOrderItemScreen.createMany({
      data: lines.map((l) => ({
        orderItemId: item.id,
        screenId: l.screen.id,
        pricingRuleId: l.rule.id,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
        pricingSnapshot: { rule: l.rule, days },
      })),
    });

    // Médias sélectionnés par l'annonceur.
    // Ils sont figés dans la commande au moment de sa création.
    await tx.mediaOrderItemMedia.createMany({
      data: input.mediaIds.map((mediaId, index) => ({
        orderItemId: item.id,
        mediaId,
        displayOrder: index + 1,
        durationSeconds: input.spotDuration,
      })),
    });

    // CampaignScreen[] / CampaignMedia[] volontairement NON créés ici :
    // matérialisés au passage PAID -> PROCESSING (Étape 4).
"@

if (-not $content.Contains($old)) {
    throw "Bloc cible introuvable dans $path. Aucun fichier modifié."
}

$content = $content.Replace($old, $new)
Set-Content $path $content -Encoding utf8

Write-Host "OK - MediaOrderItemMedia.createMany ajouté." -ForegroundColor Green
