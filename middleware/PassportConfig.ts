import passport from "passport";
import { PassportStrategy } from "../interfaces";

export default class PassportConfig {
  constructor(private readonly strategies: PassportStrategy[]) {
    this.addStrategies();
  }

  private addStrategies(): void {
    this.strategies.forEach(strategy => {
      passport.use(strategy.name, strategy.strategy);
    });
  }
}
