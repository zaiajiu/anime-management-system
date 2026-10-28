import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import Autoplay from "embla-carousel-autoplay"
import * as React from "react"
export default function HomePage() {
  // 自动播放插件：10 秒一页
  const plugin = React.useRef(
    Autoplay({ delay: 10000, stopOnInteraction: false })
  )

  return (
    <div className="flex w-full items-center justify-center py-10">
      <Carousel
        plugins={[plugin.current]}
        className="w-full max-w-[9rem] sm:max-w-[15rem]"   // 原来的 3/4
        opts={{
          align: "center",       // 当前卡居中
          loop: true,            // 循环，避免首尾露不出
        }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="-ml-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-[60%] pl-4"   // 单卡占 60%，两侧各露 1/3
            >
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}