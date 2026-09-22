CREATE UNIQUE INDEX "BundleImage_one_primary_per_bundle"
ON "BundleImage" ("bundleId")
WHERE "isPrimary" = true;