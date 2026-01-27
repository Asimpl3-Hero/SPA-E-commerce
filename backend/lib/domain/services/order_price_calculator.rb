module Domain
  module Services
    class OrderPriceCalculator
      FREE_SHIPPING_THRESHOLD_CENTS = 5_000_000  # 50,000 COP en centavos
      SHIPPING_COST_CENTS = 1_000_000            # 10,000 COP en centavos
      IVA_RATE = 0.19
      # Calcula el total de una orden a partir de items con precios ya resueltos
      # @param priced_items [Array<Hash>] Array de items con :price_cents y :quantity
      #   Ejemplo: [{ price_cents: 3000000, quantity: 2 }]
      # @return [Hash] { subtotal_cents:, shipping_cents:, total_cents: }
      def calculate(priced_items)
        return empty_calculation if priced_items.nil? || priced_items.empty?

        subtotal_cents = calculate_subtotal_cents(priced_items)
        shipping_cents = subtotal_cents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_COST_CENTS
        iva_cents = (subtotal_cents * IVA_RATE).to_i
        total_cents = subtotal_cents + shipping_cents + iva_cents

        {
          subtotal_cents: subtotal_cents,
          shipping_cents: shipping_cents,

          total_cents: total_cents
        }
      end

      # Valida que el monto proporcionado coincida con el calculado
      # @param priced_items [Array<Hash>] Array de items con :price_cents y :quantity
      # @param provided_amount_cents [Integer] Monto proporcionado por el frontend
      # @param tolerance_cents [Integer] Diferencia permitida por redondeo (default: 100 = 1 COP)
      # @return [Hash] Resultado de validación con :valid, :calculated_amount_cents, etc.
      def validate_amount(priced_items, provided_amount_cents, tolerance_cents: 100)
        calculated = calculate(priced_items)
        difference_cents = (calculated[:total_cents] - provided_amount_cents).abs

        {
          valid: difference_cents <= tolerance_cents,
          calculated_amount_cents: calculated[:total_cents],
          provided_amount_cents: provided_amount_cents,
          difference_cents: difference_cents,
          breakdown: calculated
        }
      end

      private

      def calculate_subtotal_cents(priced_items)
        priced_items.sum do |item|
          item[:price_cents] * item[:quantity].to_i
        end
      end

      def empty_calculation
        {
          subtotal_cents: 0,
          shipping_cents: SHIPPING_COST_CENTS,
          iva_cents: iva_cents,
          total_cents: SHIPPING_COST_CENTS
        }
      end
    end
  end
end
