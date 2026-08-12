-- Insert 8 missing machines into database
BEGIN;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Bernina', 'BERNINA 475 QE (QUILTER''S EDITION) SEWING MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Happy Japan', 'HAPPYJAPAN HCU2 SINGLE HEAD 15-NEEDLE EMBROIDERY MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Mutoh', 'MUTOH VALUEJET 1604X ECOSOLVENT PRINTER', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '12')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Zoje', 'ZOJE ZJ-UF-180P-A SNAP PRESS MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Zoje', 'ZOJE ZJ2293S ZIGZAG SEWING MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Zoje', 'ZOJE ZJ-740TM-452-E-02-W-SX CURVED ARM FLATSEAMER', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Zoje', 'ZOJE ZJ-APW-2520 AUTOMATED ELECTRONIC POCKET WELTING MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

INSERT INTO machines (brand, model, sub_model, unit_condition, letterhead, is_active, srp, lbp, cash_price, machine_warranty_months, printhead_warranty)
  VALUES ('Zoje', 'ZOJE ZJ-M3-S500-SF-X-LK2-V2 PATTERN SEWING MACHINE', NULL, 'Brand New', 'ES Print Media Inc.', true, 0, 0, 0, 12, '0')
  ON CONFLICT DO NOTHING;

COMMIT;
