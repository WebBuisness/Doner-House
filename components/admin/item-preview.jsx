'use client';

import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Button,
  Chip,
} from '@heroui/react';
import { Star } from 'lucide-react';

export default function ItemPreview({ item, categoryName }) {
  return (
    <div className="w-full max-w-[280px] mx-auto perspective-1000">
      <Card className="border-none bg-content1/50 backdrop-blur-md shadow-2xl" isFooterBlurred>
        <div className="relative aspect-square overflow-hidden">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name_en}
              className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
              removeWrapper
            />
          ) : (
            <div className="w-full h-full bg-content2 flex items-center justify-center text-muted-foreground italic text-xs">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2 z-10">
            <Chip
              size="sm"
              variant="flat"
              color="warning"
              startContent={<Star className="w-3 h-3 fill-current" />}
              className="backdrop-blur-md bg-black/40 text-white border-none"
            >
              {Number(item.rating || 0).toFixed(1)}
            </Chip>
          </div>
          {!item.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
              <Chip color="danger" variant="shadow" size="sm" className="font-bold uppercase tracking-wider">Unavailable</Chip>
            </div>
          )}
        </div>
        <CardBody className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-0.5">
                {categoryName || 'Category'}
              </p>
              <h4 className="font-bold text-lg leading-tight line-clamp-1">{item.name_en || 'Product Name'}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8">
                {item.desc_en || 'Product description will appear here...'}
              </p>
            </div>
          </div>
        </CardBody>
        <CardFooter className="justify-between border-t border-divider p-4 pt-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-orange-500">${Number(item.price || 0).toFixed(2)}</span>
            {item.has_combo && (
               <span className="text-[10px] text-muted-foreground line-through">${(Number(item.price || 0) + 5).toFixed(2)}</span>
            )}
          </div>
          <Button
            size="sm"
            color="warning"
            radius="full"
            className="font-bold text-xs"
          >
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
      {item.has_combo && (
        <div className="mt-2 text-center">
            <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">Combo: ${Number(item.combo_price || 0).toFixed(2)}</Chip>
        </div>
      )}
    </div>
  );
}
