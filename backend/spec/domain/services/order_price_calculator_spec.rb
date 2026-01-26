require 'spec_helper'
require_relative '../../../lib/domain/services/order_price_calculator'

RSpec.describe Domain::Services::OrderPriceCalculator do
  let(:calculator) { described_class.new }

  describe '#calculate' do
    context 'con items que califican para envío gratis (>= 50,000 COP)' do
      # 2 x 30,000 COP = 60,000 COP subtotal (>= 50,000, envío gratis)
      let(:priced_items) { [{ price_cents: 3_000_000, quantity: 2 }] }

      it 'calcula subtotal correctamente' do
        result = calculator.calculate(priced_items)
        expect(result[:subtotal_cents]).to eq(6_000_000)
      end

      it 'aplica envío gratis' do
        result = calculator.calculate(priced_items)
        expect(result[:shipping_cents]).to eq(0)
      end

      it 'calcula total correctamente' do
        result = calculator.calculate(priced_items)
        expect(result[:total_cents]).to eq(6_000_000)
      end
    end

    context 'con items que requieren envío (< 50,000 COP)' do
      # 2 x 15,000 COP = 30,000 COP subtotal (< 50,000, aplica envío)
      let(:priced_items) { [{ price_cents: 1_500_000, quantity: 2 }] }

      it 'calcula subtotal correctamente' do
        result = calculator.calculate(priced_items)
        expect(result[:subtotal_cents]).to eq(3_000_000)
      end

      it 'aplica costo de envío' do
        result = calculator.calculate(priced_items)
        expect(result[:shipping_cents]).to eq(1_000_000)
      end

      it 'calcula total con envío' do
        result = calculator.calculate(priced_items)
        expect(result[:total_cents]).to eq(4_000_000)
      end
    end

    context 'con múltiples productos' do
      # 1 x 30,000 + 2 x 15,000 = 60,000 COP subtotal (>= 50,000, envío gratis)
      let(:priced_items) do
        [
          { price_cents: 3_000_000, quantity: 1 },
          { price_cents: 1_500_000, quantity: 2 }
        ]
      end

      it 'suma todos los productos correctamente' do
        result = calculator.calculate(priced_items)
        expect(result[:subtotal_cents]).to eq(6_000_000)
      end

      it 'aplica envío gratis para el total combinado' do
        result = calculator.calculate(priced_items)
        expect(result[:shipping_cents]).to eq(0)
      end
    end

    context 'con items vacíos' do
      it 'retorna solo costo de envío' do
        result = calculator.calculate([])
        expect(result[:subtotal_cents]).to eq(0)
        expect(result[:shipping_cents]).to eq(1_000_000)
        expect(result[:total_cents]).to eq(1_000_000)
      end
    end

    context 'con items nil' do
      it 'retorna solo costo de envío' do
        result = calculator.calculate(nil)
        expect(result[:subtotal_cents]).to eq(0)
        expect(result[:shipping_cents]).to eq(1_000_000)
        expect(result[:total_cents]).to eq(1_000_000)
      end
    end

    context 'en el umbral exacto de envío gratis' do
      # Exactamente 50,000 COP = 5,000,000 centavos
      let(:priced_items) { [{ price_cents: 5_000_000, quantity: 1 }] }

      it 'aplica envío gratis en el umbral exacto' do
        result = calculator.calculate(priced_items)
        expect(result[:shipping_cents]).to eq(0)
      end
    end

    context 'justo debajo del umbral de envío gratis' do
      # 49,999 COP = 4,999,900 centavos
      let(:priced_items) { [{ price_cents: 4_999_900, quantity: 1 }] }

      it 'aplica costo de envío' do
        result = calculator.calculate(priced_items)
        expect(result[:shipping_cents]).to eq(1_000_000)
      end
    end
  end

  describe '#validate_amount' do
    # 2 x 30,000 COP = 60,000 COP subtotal, envío gratis, total = 6,000,000 centavos
    let(:priced_items) { [{ price_cents: 3_000_000, quantity: 2 }] }

    context 'cuando el monto coincide con el total calculado' do
      it 'retorna valid: true' do
        result = calculator.validate_amount(priced_items, 6_000_000)
        expect(result[:valid]).to be true
      end

      it 'incluye el monto calculado' do
        result = calculator.validate_amount(priced_items, 6_000_000)
        expect(result[:calculated_amount_cents]).to eq(6_000_000)
      end

      it 'incluye el monto proporcionado' do
        result = calculator.validate_amount(priced_items, 6_000_000)
        expect(result[:provided_amount_cents]).to eq(6_000_000)
      end

      it 'muestra diferencia cero' do
        result = calculator.validate_amount(priced_items, 6_000_000)
        expect(result[:difference_cents]).to eq(0)
      end
    end

    context 'cuando el monto está dentro de la tolerancia' do
      it 'retorna valid: true para diferencias pequeñas' do
        # 50 centavos de diferencia (dentro de tolerancia de 100 centavos)
        result = calculator.validate_amount(priced_items, 6_000_050)
        expect(result[:valid]).to be true
      end

      it 'retorna valid: true en el límite de tolerancia' do
        result = calculator.validate_amount(priced_items, 6_000_100)
        expect(result[:valid]).to be true
      end
    end

    context 'cuando el monto no coincide' do
      it 'retorna valid: false' do
        result = calculator.validate_amount(priced_items, 100)
        expect(result[:valid]).to be false
      end

      it 'muestra la diferencia' do
        result = calculator.validate_amount(priced_items, 100)
        expect(result[:difference_cents]).to eq(5_999_900)
      end

      it 'retorna valid: false justo fuera de tolerancia' do
        result = calculator.validate_amount(priced_items, 6_000_101)
        expect(result[:valid]).to be false
      end
    end

    context 'con tolerancia personalizada' do
      it 'usa la tolerancia personalizada' do
        # 500 centavos de diferencia con 1000 centavos de tolerancia
        result = calculator.validate_amount(priced_items, 6_000_500, tolerance_cents: 1000)
        expect(result[:valid]).to be true
      end

      it 'falla cuando excede la tolerancia personalizada' do
        result = calculator.validate_amount(priced_items, 6_002_000, tolerance_cents: 1000)
        expect(result[:valid]).to be false
      end
    end

    context 'incluye breakdown' do
      it 'retorna el desglose de precios en el resultado' do
        result = calculator.validate_amount(priced_items, 6_000_000)
        expect(result[:breakdown]).to eq(
          subtotal_cents: 6_000_000,
          shipping_cents: 0,
          total_cents: 6_000_000
        )
      end
    end
  end
end
