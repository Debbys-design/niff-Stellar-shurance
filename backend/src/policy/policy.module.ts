import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PolicyController } from "./policy.controller";
import { PolicyService } from "./policy.service";
import { RenewalController } from "./renewal.controller";
import { RenewalService } from "./renewal.service";
import { RenewalReminderService } from "./renewal-reminder.service";
import { RpcModule } from "../rpc/rpc.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [ScheduleModule.forRoot(), RpcModule, NotificationsModule],
  controllers: [PolicyController, RenewalController],
  providers: [PolicyService, RenewalService, RenewalReminderService],
  exports: [RenewalService],
})
export class PolicyModule {}
