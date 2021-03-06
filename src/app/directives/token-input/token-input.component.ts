import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {HttpService} from '../../services/http/http.service';

export interface ITokenInfo {
    active?: boolean;
    address: string;
    image_link: string;
    token_short_name: string;
    token_name: string;
    decimals: number;
    isEther?: boolean;
}

@Component({
  selector: 'app-token-input',
  templateUrl: './token-input.component.html',
  styleUrls: ['./token-input.component.scss']
})
export class TokenInputComponent implements OnInit {

  @Input('tokenModel') public tokenModel: any;
  @Input() public tokenGroup: any;
  @Input() private setToken: any;

  @ViewChild('tokenField') tokenField: ElementRef;
  @ViewChild('amountField') amountField: ElementRef;

  constructor(
    private httpService: HttpService
  ) {
    this.tokensList = [];
  }

  public visibleInput: boolean;
  public tokensList: ITokenInfo[];
  public listIsOpened: boolean;
  public tokenName;
  private activeTokenIndex;

  @Output() TokenChange = new EventEmitter<string>();

  private searchSubscriber;


  ngOnInit() {

    if (this.setToken) {
      this.setToken.subscribe((result) => {
        this.TokenChange.emit(this.tokenModel);
      });
    }

    this.tokenField.nativeElement.addEventListener('blur', () => {
      this.listIsOpened = false;
    });
  }
  public searchToken(q) {
    this.listIsOpened = false;
    this.tokensList = [];
    if (this.searchSubscriber) {
      this.searchSubscriber.unsubscribe();
    }

    if (!q) {
      return;
    }
    this.searchSubscriber = this.httpService.get('get_all_tokens/', {
      token_short_name: q
    }).subscribe((res: ITokenInfo[]) => {
      this.listIsOpened = true;
      this.tokensList = res;
      this.tokensList.forEach((tok) => {
        tok.isEther = tok.address === '0x0000000000000000000000000000000000000000';
      });
      if (res.length) {
        this.selectToken(res[0], 0, true);
      }
    });
  }

  public showList() {
    if (this.tokensList.length) {
      this.listIsOpened = true;
    }
  }

  public showAutoInput() {
    this.visibleInput = !this.visibleInput;
    setTimeout(() => {
      if (this.visibleInput) {
        this.tokenField.nativeElement.focus();
      } else {
        this.amountField.nativeElement.focus();
      }
    });
  }


  public selectToken(token, tokenIndex, withoutHide?: boolean) {
    if (!isNaN(this.activeTokenIndex)) {
      this.tokensList[this.activeTokenIndex].active = false;
    }
    token.active = true;
    this.activeTokenIndex = tokenIndex;
    if (withoutHide) {
      return;
    }
    this.activeTokenIndex = undefined;
    this.tokenModel.token = token;
    this.listIsOpened = false;
    this.tokenName = token.token_name + ' (' + token.token_short_name + ')';
    this.TokenChange.emit(this.tokenModel);
    this.showAutoInput();
  }

  public keyDownResult(event) {

    if (event.code === 'Escape') {
      this.showAutoInput();
      return;
    }

    const listTokensNode = event.target.parentNode.querySelector('.form-field_input__ac_res').querySelector('ul.ac_res_list');


    if (!this.tokensList.length) {
      return;
    }
    switch (event.code) {
      case 'ArrowUp':
        let newPrevIndex = this.activeTokenIndex - 1;
        if (newPrevIndex < 0) {
          newPrevIndex = this.tokensList.length - 1;
        }
        this.selectToken(this.tokensList[newPrevIndex], newPrevIndex, true);
        break;

      case 'ArrowDown':
        let newNextIndex = this.activeTokenIndex + 1;
        if (newNextIndex > this.tokensList.length - 1) {
          newNextIndex = 0;
        }
        this.selectToken(this.tokensList[newNextIndex], newNextIndex, true);
        break;
      case 'Enter':
        this.selectToken(this.tokensList[this.activeTokenIndex], this.activeTokenIndex);
        break;
    }

    setTimeout(() => {
      if (!listTokensNode) {
        return;
      }
      const activeItem = listTokensNode.querySelector('.active');
      const bottomPosition = activeItem.offsetTop + activeItem.offsetHeight;
      const maxBottomPosition = listTokensNode.scrollTop + listTokensNode.offsetHeight;
      const heightRange = maxBottomPosition - bottomPosition;
      if (heightRange < 0) {
        listTokensNode.scroll(0, listTokensNode.scrollTop - heightRange);
      } else if (activeItem.offsetTop < listTokensNode.scrollTop) {
        listTokensNode.scroll(0, activeItem.offsetTop);
      }
    });
  }

}

