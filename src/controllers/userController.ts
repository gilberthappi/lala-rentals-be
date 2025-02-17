import {
  Body,
  Get,
  Middlewares,
  Post,
  Route,
  Security,
  Tags,
  Path,
  Delete,
  Put,
} from "tsoa";
import { UserService } from "../services/userService";
import type { ILoginUser, ISignUpUser } from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import { checkRole } from "../middlewares";
import { roles } from "../utils/roles";

@Tags("Authentication")
@Route("/api/auth")
export class UserController {
  @Get("/users")
  @Middlewares(loggerMiddleware)
  public getUser() {
    return UserService.getUsers();
  }
  //delete user
  @Delete("/delete/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public deleteUser(@Path() id: string) {
    return UserService.deleteUser(Number.parseInt(id));
  }
  @Post("/request-password-reset")
  public async requestPasswordReset(@Body() body: { email: string }) {
    const { email } = body;
    return UserService.requestPasswordReset(email);
  }

  @Post("/reset-password")
  public async resetPassword(
    @Body() body: { email: string; otp: string; newPassword: string },
  ) {
    const { email, otp, newPassword } = body;
    return UserService.resetPassword(email, otp, newPassword);
  }

  @Post("signin")
  public loginUser(@Body() user: ILoginUser) {
    return UserService.loginUser(user);
  }
  //user signup
  @Post("/signup")
  public async signup(@Body() user: ISignUpUser) {
    return UserService.signUpUser(user);
  }

  @Post("/google-authenticate")
  public async googleAuthenticate(@Body() body: { token: string }) {
    const { token } = body;
    return UserService.googleAuthenticate(token);
  }

  @Get("/user/count-by-month/{year}")
  public getSchoolsCountByMonth(year: number) {
    return UserService.getUsersCountByMonth(year);
  }

  @Put("/update/{id}")
  @Security("jwt")
  @Middlewares(checkRole(roles.ADMIN))
  public updateUser(@Path() userId: string) {
    return UserService.updateUserRole(Number.parseInt(userId));
  }
}
