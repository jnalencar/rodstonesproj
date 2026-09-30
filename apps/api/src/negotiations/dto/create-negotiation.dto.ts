import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class CreateNegotiationDto {
    @IsInt()
    reservationRequestId!: number;

    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @IsOptional()
    @IsString()
    portOfLoading?: string;

    @IsOptional()
    @IsString()
    portOfDestination?: string;

    @IsOptional()
    @IsString()
    shippingMethod?: string;

    @IsOptional()
    @IsString()
    incoterm?: string;

    @IsOptional()
    @IsString()
    containerType?: string;

    @IsOptional()
    @IsString()
    deliveryTime?: string;

    @IsOptional()
    @IsNumber()
    truckingFee?: number;

    @IsOptional()
    @IsNumber()
    oceanFreight?: number;

    @IsOptional()
    @IsString()
    invoice?: string;

    @IsOptional()
    @IsString()
    packingInfo?: string;

    @IsOptional()
    @IsString()
    remarks?: string;
}