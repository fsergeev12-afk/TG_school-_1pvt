import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

/**
 * DTO для изменения порядка элементов (блоков или уроков)
 * Передаём массив ID в новом порядке
 */
export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  orderedIds: string[];
}



