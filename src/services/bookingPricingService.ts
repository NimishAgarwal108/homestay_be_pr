// src/services/bookingPricingService.ts

interface PricingCalculation {
  nights: number;
  pricePerNight: number;
  numberOfRooms: number;
  basePrice: number;
  gstAmount: number;
  totalPrice: number;
}

interface PricingParams {
  checkInDate: Date;
  checkOutDate: Date;
  pricePerNight: number;
  numberOfRooms: number;
}

export class BookingPricingService {
  private static readonly GST_RATE = 0.18; // 18% GST (Fixed)

  /**
   * Calculate number of nights between two dates
   */
  static calculateNights(checkInDate: Date, checkOutDate: Date): number {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate complete booking pricing - ONLY BASE + 18% GST
   */
  static calculatePricing(params: PricingParams): PricingCalculation {
    const nights = this.calculateNights(params.checkInDate, params.checkOutDate);
    const pricePerNight = params.pricePerNight;
    const numberOfRooms = params.numberOfRooms;
    
    // Base price calculation
    const basePrice = pricePerNight * nights * numberOfRooms;
    
    // GST calculation (18% of base price)
    const gstAmount = Math.round(basePrice * this.GST_RATE);
    
    // Total = Base + GST (No discounts)
    const totalPrice = basePrice + gstAmount;

    console.log('💰 Pricing Calculation:', {
      nights,
      pricePerNight,
      numberOfRooms,
      basePrice,
      gstAmount,
      gstRate: '18%',
      totalPrice
    });

    return {
      nights,
      pricePerNight,
      numberOfRooms,
      basePrice,
      gstAmount,
      totalPrice
    };
  }

  /**
   * Format pricing for API response
   */
  static formatPricingResponse(calculation: PricingCalculation) {
    return {
      nights: calculation.nights,
      pricePerNight: calculation.pricePerNight,
      numberOfRooms: calculation.numberOfRooms,
      basePrice: calculation.basePrice,
      gstAmount: calculation.gstAmount,
      gstRate: '18%',
      totalPrice: calculation.totalPrice
    };
  }
}